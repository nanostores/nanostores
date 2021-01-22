import { TestClient, LoguxUndoError } from '@logux/client'
import { delay } from 'nanodelay'

import {
  cleanStores,
  createdAt,
  MapDiff,
  SyncMap,
  destroy,
  loading
} from '../index.js'

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

class Post extends SyncMap {
  static plural = 'posts'
  title!: string
  category = 'none'
  author = 'Ivan'
}

class OptionalPost extends SyncMap {
  static plural = 'optionalPosts'
  title!: string
  author?: string
}

class CachedPost extends SyncMap {
  static offline = true
  static plural = 'cachedPosts'
  title?: string
}

class LocalPost extends SyncMap {
  static remote = false
  static offline = true
  static plural = 'localPosts'
  title?: string
  category?: string
}

function changeAction (fields: MapDiff<Post>, id = 'ID') {
  return { type: 'posts/change', id, fields }
}

function changedAction (fields: MapDiff<Post>, id = 'ID') {
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

function privateMethods (obj: any) {
  return obj
}

afterEach(async () => {
  await cleanStores(Post, CachedPost, LocalPost, OptionalPost)
})

it('has default plural', () => {
  let client = new TestClient('10')
  class NamelessStore extends SyncMap {}
  new NamelessStore('10', client)
  expect(NamelessStore.plural).toEqual('@logux/maps')
})

it('subscribes and unsubscribes', async () => {
  let client = new TestClient('10')
  await client.connect()

  let post: Post | undefined
  await client.server.freezeProcessing(async () => {
    post = new Post('ID', client)
    expect(post.isLoading).toBe(true)
  })
  if (!post) throw new Error('User is empty')

  await delay(10)
  expect(post.isLoading).toBe(false)
  expect(client.subscribed('posts/ID')).toBe(true)

  post[destroy]()
  await delay(10)
  expect(client.subscribed('posts/ID')).toBe(false)
})

it('changes key', async () => {
  let client = createAutoprocessingClient()
  await client.connect()

  let post = new Post('ID', client)
  let changes: MapDiff<Post>[] = []
  post.subscribe((store, diff) => {
    changes.push(diff)
  })

  expect(post.title).toBeUndefined()
  expect(post.category).toEqual('none')

  await post[loading]

  post.change('title', '1')
  post.change('category', 'demo')
  expect(post.title).toEqual('1')
  expect(post.category).toEqual('demo')
  expect(changes).toEqual([])

  await delay(1)
  expect(changes).toEqual([{ title: '1', category: 'demo' }])

  await delay(10)
  let actions = await client.sent(async () => {
    await post.change('title', '2')
  })
  expect(actions).toEqual([changeAction({ title: '2' })])

  await client.log.add(changeAction({ title: '3' }))
  expect(post.title).toEqual('3')

  client.server.log.add(changedAction({ title: '4' }))
  await delay(20)
  expect(post.title).toEqual('4')

  expect(changes).toEqual([
    { title: '1', category: 'demo' },
    { title: '2' },
    { title: '3' },
    { title: '4' }
  ])
  expect(client.log.actions()).toEqual([
    changeAction({ category: 'demo' }),
    changedAction({ title: '4' })
  ])
})

it('cleans log', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post('ID', client)

  await post.change('title', '1')
  await post.change('title', '2')

  post[destroy]()
  await delay(10)
  expect(client.log.actions()).toEqual([])
})

it('returns Promise on changing', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post('ID', client)

  let resolved = false
  await client.server.freezeProcessing(async () => {
    post.change('title', '1').then(() => {
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
  let post = new Post('ID', client)

  await post.change('title', 'New')
  await client.log.add(changeAction({ title: 'Old 1' }), { time: 0 })
  await client.server.log.add(changedAction({ title: 'Old 2' }), { time: 0 })
  await delay(10)

  expect(post.title).toEqual('New')
  expect(client.log.actions()).toEqual([changeAction({ title: 'New' })])
})

it('reverts changes for simple case', async () => {
  let client = createAutoprocessingClient()
  await client.connect()
  let post = new Post('ID', client)

  let changes: string[] = []
  post.subscribe((store, diff) => {
    changes.push(diff.title ?? '')
  })

  await post[loading]
  await post.change('title', 'Good')

  client.server.undoNext()
  let promise = post.change('title', 'Bad')
  expect(post.title).toEqual('Bad')

  let error = await catchError(() => promise)
  expect(error.message).toEqual('Server undid posts/change because of error')
  await delay(10)
  expect(post.title).toEqual('Good')
  expect(client.log.actions()).toEqual([changeAction({ title: 'Good' })])
  expect(changes).toEqual(['Good', 'Bad', 'Good'])
})

it('reverts changes for multiple actions case', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post('ID', client)

  client.server.undoAction(changeAction({ title: 'Bad' }))
  await post.change('title', 'Good 1')
  await client.server.freezeProcessing(async () => {
    post.change('title', 'Bad')
    await delay(10)
    await client.log.add(changedAction({ title: 'Good 2' }), { time: 4 })
  })

  expect(post.title).toEqual('Good 2')
})

it('filters action by ID', async () => {
  let client = new TestClient('10')
  await client.connect()

  let post1 = new Post('1', client)
  let post2 = new Post('2', client)

  await post1.change('title', 'A')
  await post2.change('title', 'B')
  await client.log.add(changedAction({ title: 'C' }, '2'))

  client.server.undoNext()
  post1.change('title', 'Bad')
  await delay(20)

  expect(post1.title).toEqual('A')
  expect(post2.title).toEqual('C')
})

it('does not allow to change keys manually', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post('ID', client)

  await post.change('title', '1')

  let error = await catchError(() => {
    post.title = '2'
  })
  expect(error.message).toContain("read only property 'title'")
})

it('does not emit events on non-changes', async () => {
  let client = createAutoprocessingClient()
  await client.connect()
  let post = new Post('ID', client)

  let changes: (string | undefined)[] = []
  post.subscribe((store, diff) => {
    changes.push(diff.title ?? '')
  })

  await post[loading]

  await post.change('title', '1')
  await post.change('title', '1')

  expect(changes).toEqual(['1'])
})

it('supports bulk changes', async () => {
  let client = createAutoprocessingClient()
  await client.connect()
  let post = new Post('ID', client)

  let changes: MapDiff<Post>[] = []
  post.subscribe((store, diff) => {
    changes.push(diff)
  })

  await post[loading]

  await post.change({ title: '1', category: 'demo' })
  await post.change({ title: '1' })
  await post.change({ title: '3' })
  await client.log.add(changeAction({ title: '2', author: 'Yaropolk' }), {
    time: 4
  })
  expect(post.title).toEqual('3')
  expect(post.category).toEqual('demo')
  expect(post.author).toEqual('Yaropolk')

  client.server.undoNext()
  post.change({ category: 'bad', author: 'Badly' })
  await delay(20)

  expect(post.title).toEqual('3')
  expect(post.category).toEqual('demo')
  expect(post.author).toEqual('Yaropolk')
  expect(changes).toEqual([
    { title: '1', category: 'demo' },
    { title: '3' },
    { category: 'bad', author: 'Badly' },
    { author: 'Yaropolk', category: 'demo' }
  ])
})

it('could cache specific stores without server', async () => {
  let client = new TestClient('10')
  let post: LocalPost | undefined

  let sent = await client.sent(async () => {
    post = new LocalPost('ID', client)
    await post.change('title', 'The post')
  })
  if (!post) throw new Error('post is empty')
  expect(sent).toEqual([])

  await post.change('title', 'The post')
  await delay(10)

  post[destroy]()
  await delay(10)

  expect(client.log.actions()).toEqual([
    { type: 'localPosts/changed', id: 'ID', fields: { title: 'The post' } }
  ])

  let restored = new LocalPost('ID', client)
  await restored[loading]
  await delay(10)
  expect(restored.title).toEqual('The post')
})

it('throws 404 on missing offline map in local log', async () => {
  let client = new TestClient('10')
  let post = LocalPost.load('ID', client)

  let error: Error | undefined
  try {
    await post[loading]
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
  let post = new CachedPost('ID', client)

  expect(client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'cachedPosts/ID' }
  ])

  await post.change('title', 'The post')
  await delay(10)

  post[destroy]()
  await delay(20)

  expect(client.log.actions()).toEqual([
    { type: 'cachedPosts/changed', id: 'ID', fields: { title: 'The post' } }
  ])

  let restored = new CachedPost('ID', client)
  await restored[loading]
  await delay(10)
  expect(restored.title).toEqual('The post')
})

it('creates maps', async () => {
  let client = new TestClient('10')
  let created = false
  Post.create(client, {
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
  expect(created).toBe(true)
})

it('uses default prefix for create actions', () => {
  let client = new TestClient('10')
  class Test extends SyncMap {
    value!: string
  }
  Test.create(client, {
    id: 'random',
    value: '1'
  })

  expect(client.log.actions()).toEqual([
    {
      type: '@logux/maps/create',
      id: 'random',
      fields: {
        value: '1'
      }
    }
  ])
})

it('deletes maps', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post.load('DEL', client)

  await post.change('title', 'Deleted')

  let deleted = false
  await client.server.freezeProcessing(async () => {
    post.delete().then(() => {
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
  client.keepActions()

  let post1 = LocalPost.load('DEL', client)
  await post1.change({ title: 'Deleted', category: 'deleted' })
  await post1.delete()

  await cleanStores(LocalPost)

  await LocalPost.create(client, { id: 'DEL', title: 'New' })
  let post2 = LocalPost.load('DEL', client)
  await post2[loading]
  expect(post2.title).toEqual('New')
  expect(post2.category).toBeUndefined()
})

it('uses created and delete during undo', async () => {
  let client = new TestClient('10')
  await client.connect()
  client.keepActions()

  let post1 = OptionalPost.load('ID', client)
  await post1.change('title', 'Deleted')
  await post1.change('author', 'Deleter')
  await post1.delete()

  await OptionalPost.create(client, { id: 'ID', title: 'New' })
  let post2 = OptionalPost.load('ID', client)

  client.server.undoNext()
  post2.change({ title: 'Bad', author: 'Bad' })
  await delay(10)
  expect(post2.title).toEqual('New')
  expect(post2.author).toBeUndefined()
})

it('supports deleted action', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post.load('DEL', client)

  await post.change('title', 'Deleted')
  await client.log.add({ type: 'posts/deleted', id: 'DEL' })

  expect(client.log.actions()).toEqual([])
})

it('deletes without store loading', async () => {
  let client = new TestClient('10')
  await client.connect()
  expect(
    await client.sent(async () => {
      await Post.delete(client, 'DEL')
    })
  ).toEqual([{ type: 'posts/delete', id: 'DEL' }])
})

it('undos delete', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post.load('DEL', client)

  await post.change('title', 'Deleted')

  let deleted: boolean | undefined
  client.server.undoNext()
  post
    .delete()
    .then(() => {
      deleted = true
    })
    .catch(() => {
      deleted = false
    })
  await delay(10)
  expect(deleted).toBe(false)
  expect(client.log.actions()).toEqual([
    { type: 'posts/change', id: 'DEL', fields: { title: 'Deleted' } }
  ])
})

it('can be loaded from create action', () => {
  let client = new TestClient('10')
  let post = Post.load('ID', client)
  let meta = { time: 0, id: client.log.generateId() }
  post.processCreate(
    { type: 'posts/created', id: 'ID', fields: { category: 'good' } },
    meta
  )
  expect(post.category).toBe('good')
  expect(post[createdAt]).toEqual(meta)
})

it('converts to JSON', () => {
  let client = new TestClient('10')
  let post = Post.load('ID', client)
  privateMethods(post).test = () => {}
  post.change('title', 'Test')

  expect(post.toJSON()).toEqual({
    id: 'ID',
    title: 'Test',
    author: 'Ivan',
    category: 'none'
  })
})
