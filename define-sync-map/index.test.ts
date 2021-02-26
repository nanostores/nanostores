import { TestClient, LoguxUndoError } from '@logux/client'
import { delay } from 'nanodelay'

import {
  changeSyncMapById,
  deleteSyncMapById,
  defineSyncMap,
  changeSyncMap,
  createSyncMap,
  deleteSyncMap,
  SyncMapValue,
  cleanStores,
  getValue
} from '../index.js'
import { buildNewSyncMap } from './index.js'

async function catchError (cb: () => Promise<any> | void) {
  let error: LoguxUndoError | undefined
  try {
    await cb()
  } catch (e) {
    error = e
  }
  if (!error) throw new Error('Error was no raised')
  return error
}

type PostValue = {
  title: string
  category?: string
  author?: string
}

let Post = defineSyncMap<PostValue>('posts')

let CachedPost = defineSyncMap<{
  title: string
}>('cachedPosts', {
  offline: true
})

let LocalPost = defineSyncMap<{
  title: string
  category?: string
}>('localPosts', {
  offline: true,
  remote: false
})

function changeAction (fields: Partial<PostValue>, id = 'ID') {
  return { type: 'posts/change', id, fields }
}

function changedAction (fields: Partial<PostValue>, id = 'ID') {
  return { type: 'posts/changed', id, fields }
}

function createAutoprocessingClient () {
  let client = new TestClient('10')
  client.on('add', (action, meta) => {
    if (action.type === 'logux/subscribe') {
      client.log.add({ type: 'logux/processed', id: meta.id })
    }
  })
  return client
}

function clone (obj: object) {
  return JSON.parse(JSON.stringify(obj))
}

afterEach(async () => {
  cleanStores(Post, CachedPost, LocalPost)
})

it('saves options to class', () => {
  expect(CachedPost.plural).toEqual('cachedPosts')
  expect(CachedPost.offline).toBe(true)
  expect(CachedPost.remote).toBe(true)
  expect(LocalPost.remote).toBe(false)
})

it('saves options to store', () => {
  let client = new TestClient('10')
  let cached = CachedPost('ID', client)
  cached.listen(() => {})
  expect(cached.plural).toEqual('cachedPosts')
  expect(cached.offline).toBe(true)
  expect(cached.remote).toBe(true)
})

it('throws on missed client', () => {
  // @ts-expect-error
  let post = Post('ID')
  expect(() => {
    post.listen(() => {})
  }).toThrow('Missed Logux client')
})

it('subscribes and unsubscribes', async () => {
  let client = new TestClient('10')
  await client.connect()

  let post = Post('ID', client)
  let unbind = () => {}
  await client.server.freezeProcessing(async () => {
    unbind = post.listen(() => {})
    expect(getValue(post).isLoading).toBe(true)
  })

  await delay(10)
  expect(getValue(post).isLoading).toBe(false)
  expect(client.subscribed('posts/ID')).toBe(true)

  unbind()
  await delay(1020)
  expect(client.subscribed('posts/ID')).toBe(false)
})

it('changes key', async () => {
  let client = createAutoprocessingClient()
  await client.connect()

  let post = Post('ID', client)
  let changes: SyncMapValue<PostValue>[] = []
  post.subscribe(value => {
    changes.push(clone(value))
  })

  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: true
  })

  await post.loading

  changeSyncMap(post, 'title', '1')
  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: '1'
  })
  expect(changes).toEqual([
    { id: 'ID', isLoading: true },
    { id: 'ID', isLoading: false },
    { id: 'ID', isLoading: false, title: '1' }
  ])

  changeSyncMapById(client, Post, 'ID', 'category', 'demo')
  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: '1'
  })

  await delay(1)
  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: '1',
    category: 'demo'
  })

  let actions = await client.sent(async () => {
    await changeSyncMap(post, 'title', '2')
  })
  expect(actions).toEqual([changeAction({ title: '2' })])

  await client.log.add(changeAction({ title: '3' }))
  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: '3',
    category: 'demo'
  })

  client.server.log.add(changedAction({ title: '4' }))
  await delay(20)
  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: '4',
    category: 'demo'
  })

  expect(client.log.actions()).toEqual([
    changeAction({ category: 'demo' }),
    changedAction({ title: '4' })
  ])
})

it('cleans log', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post('ID', client)
  let unbind = post.listen(() => {})

  await changeSyncMap(post, 'title', '1')
  await changeSyncMap(post, 'title', '1')

  unbind()
  await delay(1020)
  expect(client.log.actions()).toEqual([])
})

it('returns Promise on changing', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post('ID', client)
  post.listen(() => {})

  let resolved = false
  await client.server.freezeProcessing(async () => {
    changeSyncMap(post, 'title', '1').then(() => {
      resolved = true
    })
    await delay(10)
    expect(resolved).toBe(false)
  })
  expect(resolved).toBe(true)
})

it('ignores old actions', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post('ID', client)
  post.listen(() => {})

  await changeSyncMap(post, 'title', 'New')
  await client.log.add(changeAction({ title: 'Old 1' }), { time: 0 })
  await client.server.log.add(changedAction({ title: 'Old 2' }), { time: 0 })
  await delay(10)

  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: 'New'
  })
  expect(client.log.actions()).toEqual([changeAction({ title: 'New' })])
})

it('reverts changes for simple case', async () => {
  let client = createAutoprocessingClient()
  await client.connect()
  let post = Post('ID', client)
  post.listen(() => {})

  await post.loading
  await changeSyncMap(post, 'title', 'Good')

  client.server.undoNext()
  let promise = changeSyncMap(post, 'title', 'Bad')
  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: 'Bad'
  })

  let error = await catchError(() => promise)
  expect(error.message).toEqual('Server undid posts/change because of error')

  await delay(10)
  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: 'Good'
  })
  expect(client.log.actions()).toEqual([changeAction({ title: 'Good' })])
})

it('reverts changes for multiple actions case', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post('ID', client)
  post.listen(() => {})

  client.server.undoAction(changeAction({ title: 'Bad' }))
  await changeSyncMap(post, 'title', 'Good 1')
  await client.server.freezeProcessing(async () => {
    changeSyncMap(post, 'title', 'Bad')
    await delay(10)
    await client.log.add(changedAction({ title: 'Good 2' }), { time: 4 })
  })

  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: 'Good 2'
  })
})

it('filters action by ID', async () => {
  let client = new TestClient('10')
  await client.connect()

  let post1 = Post('1', client)
  let post2 = Post('2', client)
  post1.listen(() => {})
  post2.listen(() => {})

  await changeSyncMap(post1, 'title', 'A')
  await changeSyncMap(post2, 'title', 'B')
  await client.log.add(changedAction({ title: 'C' }, '2'))

  client.server.undoNext()
  changeSyncMap(post1, 'title', 'Bad')
  await delay(20)

  expect(getValue(post1)).toEqual({
    id: '1',
    isLoading: false,
    title: 'A'
  })
  expect(getValue(post2)).toEqual({
    id: '2',
    isLoading: false,
    title: 'C'
  })
})

it('supports bulk changes', async () => {
  let client = createAutoprocessingClient()
  await client.connect()
  let post = Post('ID', client)
  post.listen(() => {})

  await post.loading

  await changeSyncMap(post, { title: '1', category: 'demo' })
  await changeSyncMap(post, { title: '1' })
  await changeSyncMap(post, { title: '3' })
  await client.log.add(changeAction({ title: '2', author: 'Yaropolk' }), {
    time: 4
  })
  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: '3',
    category: 'demo',
    author: 'Yaropolk'
  })

  client.server.undoNext()
  changeSyncMap(post, { category: 'bad', author: 'Badly' })
  await delay(50)

  expect(getValue(post)).toEqual({
    id: 'ID',
    isLoading: false,
    title: '3',
    category: 'demo',
    author: 'Yaropolk'
  })
})

it('could cache specific stores without server', async () => {
  let client = new TestClient('10')
  client.on('preadd', (action, meta) => {
    if (action.type === 'localPosts/created') {
      meta.reasons.push('test')
    }
  })
  await createSyncMap(client, LocalPost, {
    id: 'ID',
    title: 'Previous',
    category: 'demo'
  })
  let post = LocalPost('ID', client)

  let unbind = () => {}
  let sent = await client.sent(async () => {
    unbind = post.listen(() => {})
    await changeSyncMap(post, 'title', '1')
  })
  expect(sent).toEqual([])

  await changeSyncMap(post, 'title', 'The post')
  await delay(10)

  unbind()
  await delay(10)

  expect(client.log.actions()).toEqual([
    {
      type: 'localPosts/created',
      id: 'ID',
      fields: {
        title: 'Previous',
        category: 'demo'
      }
    },
    { type: 'localPosts/changed', id: 'ID', fields: { title: 'The post' } }
  ])

  let restored = LocalPost('ID', client)
  restored.listen(() => {})
  await restored.loading
  expect(getValue(restored)).toEqual({
    id: 'ID',
    isLoading: false,
    title: 'The post',
    category: 'demo'
  })
})

it('throws on error from server', async () => {
  let client = new TestClient('10')
  await client.connect()

  client.server.undoNext()
  let post = Post('ID', client)
  let unbind = post.listen(() => {})

  let error: Error | undefined
  try {
    await post.loading
  } catch (e) {
    error = e
  }

  await delay(50)
  expect(error?.message).toEqual(
    'Server undid logux/subscribe because of error'
  )

  unbind()
  await delay(50)
})

it('throws 404 on missing offline map in local log', async () => {
  let client = new TestClient('10')
  let post = LocalPost('ID', client)
  post.listen(() => {})

  let error: Error | undefined
  try {
    await post.loading
  } catch (e) {
    error = e
  }

  expect(error?.message).toEqual(
    'Server undid logux/subscribe because of notFound'
  )
})

it('could cache specific stores and use server', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = CachedPost('ID', client)
  let unbind = post.listen(() => {})

  expect(client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'cachedPosts/ID' }
  ])

  await changeSyncMap(post, 'title', 'The post')
  await delay(10)

  unbind()
  await delay(20)

  expect(client.log.actions()).toEqual([
    { type: 'cachedPosts/changed', id: 'ID', fields: { title: 'The post' } }
  ])

  let restored = CachedPost('ID', client)
  restored.listen(() => {})
  await restored.loading
  await delay(10)
  expect(getValue(restored)).toEqual({
    id: 'ID',
    isLoading: false,
    title: 'The post'
  })
})

it('creates maps', async () => {
  let client = new TestClient('10')
  let created = false
  createSyncMap(client, Post, {
    id: 'random',
    title: 'Test',
    category: 'none',
    author: 'Ivan'
  }).then(() => {
    created = true
  })

  expect(client.log.actions()).toEqual([
    {
      type: 'posts/create',
      id: 'random',
      fields: {
        title: 'Test',
        category: 'none',
        author: 'Ivan'
      }
    }
  ])

  await delay(1)
  expect(created).toBe(false)

  await client.log.add({
    type: 'logux/processed',
    id: client.log.entries()[0][1].id
  })
  await delay(1)
  expect(created).toBe(true)
})

it('deletes maps', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post('DEL', client)
  post.listen(() => {})

  await changeSyncMap(post, 'title', 'Deleted')

  let deleted = false
  await client.server.freezeProcessing(async () => {
    deleteSyncMap(post).then(() => {
      deleted = true
    })
    expect(client.log.actions()).toEqual([
      { type: 'posts/change', id: 'DEL', fields: { title: 'Deleted' } },
      { type: 'posts/delete', id: 'DEL' }
    ])
    await delay(1)
    expect(deleted).toBe(false)
  })
  expect(deleted).toBe(true)
  expect(client.log.actions()).toEqual([])
})

it('creates and deletes local maps', async () => {
  let client = new TestClient('10')
  client.log.keepActions()

  await createSyncMap(client, LocalPost, { id: 'DEL', title: 'New' })
  let post1 = LocalPost('DEL', client)
  let unbind = post1.listen(() => {})
  await changeSyncMap(post1, { title: 'Deleted', category: 'deleted' })
  await deleteSyncMap(post1)

  unbind()
  await delay(1020)

  await createSyncMap(client, LocalPost, { id: 'DEL', title: 'New' })
  let post2 = LocalPost('DEL', client)
  post2.listen(() => {})
  await post2.loading
  expect(getValue(post2)).toEqual({
    id: 'DEL',
    isLoading: false,
    title: 'New'
  })
})

it('uses created and delete during undo', async () => {
  let client = new TestClient('10')
  await client.connect()
  client.log.keepActions()

  let post1 = Post('ID', client)
  post1.listen(() => {})
  await changeSyncMap(post1, 'title', 'Deleted')
  await changeSyncMap(post1, 'author', 'Deleter')
  await deleteSyncMap(post1)

  await createSyncMap(client, Post, { id: 'ID', title: 'New' })
  let post2 = Post('ID', client)
  post2.listen(() => {})

  client.server.undoNext()
  await changeSyncMap(post2, { title: 'Bad', author: 'Bad' }).catch(() => {})
  await delay(20)
  expect(getValue(post2)).toEqual({
    id: 'ID',
    isLoading: false,
    title: 'New'
  })
})

it('supports deleted action', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post('DEL', client)
  post.listen(() => {})

  await changeSyncMap(post, 'title', 'Deleted')
  await client.log.add({ type: 'posts/deleted', id: 'DEL' })

  expect(client.log.actions()).toEqual([])
})

it('deletes without store loading', async () => {
  let client = new TestClient('10')
  await client.connect()
  expect(
    await client.sent(async () => {
      await deleteSyncMapById(client, Post, 'DEL')
    })
  ).toEqual([{ type: 'posts/delete', id: 'DEL' }])
})

it('undos delete', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post('DEL', client)
  post.listen(() => {})

  await changeSyncMap(post, 'title', 'Deleted')

  let deleted: boolean | undefined
  client.server.undoNext()
  deleteSyncMap(post)
    .then(() => {
      deleted = true
    })
    .catch(() => {
      deleted = false
    })
  await delay(20)
  expect(deleted).toBe(false)
  expect(client.log.actions()).toEqual([
    { type: 'posts/change', id: 'DEL', fields: { title: 'Deleted' } }
  ])
})

it('allows to send create action and return instance', async () => {
  let client = new TestClient('10')
  await client.connect()
  expect(
    await client.sent(async () => {
      let post = await buildNewSyncMap(client, Post, {
        id: 'ID',
        title: 'Test',
        author: 'Ivan',
        category: 'none'
      })
      post.listen(() => {})
      expect(getValue(post)).toEqual({
        id: 'ID',
        isLoading: false,
        title: 'Test',
        author: 'Ivan',
        category: 'none'
      })
      expect(post.createdAt?.id).toEqual('1 10:2:2 0')
      expect(post.createdAt?.time).toEqual(1)
    })
  ).toEqual([
    {
      type: 'posts/create',
      id: 'ID',
      fields: {
        title: 'Test',
        author: 'Ivan',
        category: 'none'
      }
    },
    { type: 'logux/subscribe', channel: 'posts/ID', creating: true }
  ])
})

it('does not send subscription on local store creation', async () => {
  let client = new TestClient('10')
  client.log.keepActions()
  await client.connect()
  expect(
    await client.sent(async () => {
      let post = await buildNewSyncMap(client, LocalPost, {
        id: 'ID',
        title: 'Test',
        category: 'none'
      })
      post.listen(() => {})
      expect(getValue(post)).toEqual({
        id: 'ID',
        isLoading: false,
        title: 'Test',
        category: 'none'
      })
    })
  ).toEqual([])
  expect(client.log.actions()).toEqual([
    {
      type: 'localPosts/created',
      id: 'ID',
      fields: { category: 'none', title: 'Test' }
    }
  ])
})

it('loads data by created action', async () => {
  let client = new TestClient('10')
  client.log.keepActions()
  await client.connect()

  let post = Post('1', client)
  post.listen(() => {})

  await client.log.add({
    type: 'posts/created',
    id: '1',
    fields: { title: 'A', category: 'demo' }
  })
  expect(getValue(post)).toEqual({
    id: '1',
    isLoading: true,
    title: 'A',
    category: 'demo'
  })
})
