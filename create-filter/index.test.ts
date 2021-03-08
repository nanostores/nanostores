import { TestClient } from '@logux/client'
import { delay } from 'nanodelay'

import {
  changeSyncMapById,
  deleteSyncMapById,
  buildNewSyncMap,
  createSyncMap,
  defineSyncMap,
  changeSyncMap,
  createFilter,
  cleanStores,
  FilterStore,
  getValue
} from '../index.js'

let Post = defineSyncMap<{
  title: string
  authorId: string
  projectId: string
}>('posts')

let LocalPost = defineSyncMap<{
  title: string
  authorId?: string
  projectId: string
  category?: string
}>('local', {
  offline: true,
  remote: false
})

let CachedPost = defineSyncMap<{
  title: string
  projectId: string
}>('cached', {
  offline: true
})

let User = defineSyncMap<{ name: string; projectId: string }>('users')

afterEach(() => {
  cleanStores(Post, LocalPost, CachedPost, User)
})

function cachedIds (Builder: any): string[] {
  return Object.keys(Builder.cache)
}

function checkIds (filterStore: FilterStore, ids: string[]): void {
  expect(getValue(filterStore).list.map(i => i.id)).toEqual(ids)
}

function getSize (filterStore: FilterStore): number {
  return getValue(filterStore).stores.size
}

it('caches filters', () => {
  let client = new TestClient('10')
  let filter1 = createFilter(client, Post, { projectId: '10' })
  let filter2 = createFilter(client, Post, { projectId: '10' })
  let filter3 = createFilter(client, Post, { projectId: '10' }, {})
  let filter4 = createFilter(
    client,
    Post,
    { projectId: '10' },
    { listChangesOnly: true }
  )
  let filter5 = createFilter(client, Post, { projectId: '20' })
  let filter6 = createFilter(client, User, { projectId: '20' })

  expect(filter1).toBe(filter2)
  expect(filter1).toBe(filter3)
  expect(filter1).not.toBe(filter4)
  expect(filter1).not.toBe(filter5)
  expect(filter1).not.toBe(filter6)

  filter1.listen(() => {})
  filter2.listen(() => {})
  filter3.listen(() => {})
  filter4.listen(() => {})
  filter5.listen(() => {})
  filter6.listen(() => {})
  expect(client.log.actions()).toHaveLength(4)
})

it('looks for already loaded stores', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post1 = Post('1', client)
  let post2 = Post('2', client)
  let post3 = Post('3', client)
  let post4 = Post('4', client)

  post1.listen(() => {})
  post2.listen(() => {})
  post3.listen(() => {})
  post4.listen(() => {})

  await changeSyncMap(post1, { projectId: '100', authorId: '10' })
  await changeSyncMap(post2, { projectId: '100', authorId: '10' })
  await changeSyncMap(post3, { projectId: '200', authorId: '10' })
  await changeSyncMap(post4, { projectId: '100', authorId: '11' })

  let posts = createFilter(client, Post, {
    projectId: '100',
    authorId: '10'
  })
  posts.listen(() => {})

  expect(getValue(posts).isLoading).toBe(true)
  expect(getValue(posts).stores).toEqual(
    new Map([
      ['1', post1],
      ['2', post2]
    ])
  )
  expect(getValue(posts).list).toEqual([
    { id: '1', isLoading: false, authorId: '10', projectId: '100' },
    { id: '2', isLoading: false, authorId: '10', projectId: '100' }
  ])
})

it('subscribes to channels for remote stores', async () => {
  let client = new TestClient('10')
  client.log.keepActions()
  await client.connect()

  let resolved = false
  let posts = createFilter(client, Post, { projectId: '1' })

  await delay(1)
  expect(client.log.actions()).toHaveLength(0)

  let unbind: (() => void) | undefined
  await client.server.freezeProcessing(async () => {
    unbind = posts.listen(() => {})
    posts.loading.then(() => {
      resolved = true
    })
    await delay(1)
    expect(client.log.actions()).toEqual([
      { type: 'logux/subscribe', channel: 'posts', filter: { projectId: '1' } }
    ])
    expect(resolved).toBe(false)
    expect(getValue(posts).isLoading).toBe(true)
  })
  expect(resolved).toBe(true)
  expect(getValue(posts).isLoading).toBe(false)

  expect(
    await client.sent(async () => {
      unbind?.()
      await delay(1020)
    })
  ).toEqual([
    { type: 'logux/unsubscribe', channel: 'posts', filter: { projectId: '1' } }
  ])

  expect(
    await client.sent(async () => {
      let cached = createFilter(client, CachedPost, { projectId: '1' })
      let unbindCached = cached.listen(() => {})
      unbindCached()
      await delay(1020)
    })
  ).toEqual([
    { type: 'logux/subscribe', channel: 'cached', filter: { projectId: '1' } },
    { type: 'logux/unsubscribe', channel: 'cached', filter: { projectId: '1' } }
  ])

  expect(
    await client.sent(async () => {
      let local = createFilter(client, LocalPost, { projectId: '1' })
      let unbindLocal = local.listen(() => {})
      unbindLocal()
    })
  ).toEqual([])
})

it('loads store from the log for offline stores', async () => {
  let client = new TestClient('10')
  client.log.keepActions()
  await createSyncMap(client, LocalPost, {
    id: '1',
    title: 'Post 1a',
    projectId: '10'
  })
  await deleteSyncMapById(client, LocalPost, '1')

  await createSyncMap(client, LocalPost, {
    id: '1',
    title: 'Post 1b',
    projectId: '20'
  })

  await createSyncMap(client, LocalPost, {
    id: '2',
    title: 'Post 2',
    projectId: '20'
  })
  await changeSyncMapById(client, LocalPost, '2', 'projectId', '10')
  await changeSyncMapById(client, LocalPost, '2', 'projectId', '30')

  await createSyncMap(client, LocalPost, {
    id: '3',
    title: 'Post 3',
    projectId: '10'
  })
  await deleteSyncMapById(client, LocalPost, '3')

  await createSyncMap(client, LocalPost, {
    id: '4',
    title: 'Post 4',
    projectId: '20'
  })
  await changeSyncMapById(client, LocalPost, '4', 'projectId', '10')

  await createSyncMap(client, LocalPost, {
    id: '5',
    title: 'Post 5',
    projectId: '10'
  })

  cleanStores(LocalPost)

  let posts = createFilter(client, LocalPost, { projectId: '10' })
  posts.listen(() => {})
  await posts.loading
  expect(getValue(posts).isLoading).toBe(false)
  expect(Array.from(getValue(posts).stores.keys()).sort()).toEqual(['4', '5'])
  await delay(1020)
  expect(cachedIds(LocalPost)).toEqual(['4', '5'])
})

it('supports both offline and remote stores', async () => {
  let client = new TestClient('10')
  client.log.keepActions()
  await client.connect()

  await createSyncMap(client, CachedPost, {
    id: 'ID',
    projectId: '10',
    title: 'Cached'
  })

  let posts = createFilter(client, CachedPost, { projectId: '10' })
  await client.server.freezeProcessing(async () => {
    posts.listen(() => {})
    await delay(10)
    expect(getSize(posts)).toEqual(1)
    expect(getValue(posts).isLoading).toBe(true)
  })
  await delay(10)
  expect(getValue(posts).isLoading).toBe(false)
  expect(Array.from(getValue(posts).stores.keys())).toEqual(['ID'])
})

it('keeps stores in memory and unsubscribes on destroy', async () => {
  let client = new TestClient('10')
  await client.connect()

  let post = Post('1', client)
  let clearPost = post.listen(() => {})
  await changeSyncMap(post, 'authorId', '10')

  let posts = createFilter(client, Post, { authorId: '10' })
  let clearFilter = posts.listen(() => {})
  clearPost()

  await delay(1020)
  expect(cachedIds(Post)).toEqual(['1'])

  clearFilter()
  await delay(2020)
  expect(cachedIds(Post)).toHaveLength(0)
})

it('updates list on store create/deleted/change', async () => {
  let client = new TestClient('10')
  await client.connect()

  let posts = createFilter(client, Post, {
    authorId: '1',
    projectId: '1'
  })
  let changes: string[] = []
  posts.listen((value, key) => {
    changes.push(key)
  })

  await posts.loading
  expect(getSize(posts)).toEqual(0)
  expect(changes).toEqual(['isLoading'])

  await createSyncMap(client, Post, {
    id: '1',
    title: '1',
    projectId: '1',
    authorId: '1'
  })
  expect(getSize(posts)).toEqual(1)
  expect(changes).toEqual(['isLoading', 'stores', 'list', 'isEmpty'])

  let post2 = await buildNewSyncMap(client, Post, {
    id: '2',
    title: '2',
    projectId: '2',
    authorId: '2'
  })
  post2.listen(() => {})
  expect(getSize(posts)).toEqual(1)

  await changeSyncMapById(client, Post, '2', 'title', '1')
  expect(getSize(posts)).toEqual(1)

  await changeSyncMapById(client, Post, '2', 'projectId', '1')
  expect(getSize(posts)).toEqual(1)

  await changeSyncMapById(client, Post, '2', 'authorId', '1')
  expect(getSize(posts)).toEqual(2)
  expect(changes).toEqual([
    'isLoading',
    'stores',
    'list',
    'isEmpty',
    'stores',
    'list'
  ])

  await changeSyncMapById(client, Post, '2', 'authorId', '2')
  expect(getSize(posts)).toEqual(1)
  expect(changes).toEqual([
    'isLoading',
    'stores',
    'list',
    'isEmpty',
    'stores',
    'list',
    '2.authorId',
    'stores',
    'list'
  ])

  await deleteSyncMapById(client, Post, '1')
  expect(getSize(posts)).toEqual(0)
  expect(changes).toEqual([
    'isLoading',
    'stores',
    'list',
    'isEmpty',
    'stores',
    'list',
    '2.authorId',
    'stores',
    'list',
    'stores',
    'list',
    'isEmpty'
  ])
})

it('updates list on store created/deleted/changed', async () => {
  let client = new TestClient('10')
  client.log.keepActions()

  let posts = createFilter(client, LocalPost, {
    category: 'test',
    projectId: '1'
  })
  posts.listen(() => {})

  await posts.loading
  expect(getSize(posts)).toEqual(0)

  await createSyncMap(client, LocalPost, {
    id: '1',
    title: '1',
    projectId: '1',
    category: 'test'
  })
  expect(getSize(posts)).toEqual(1)

  let post2 = await buildNewSyncMap(client, LocalPost, {
    id: '2',
    title: '2',
    projectId: '2',
    category: 'wrong'
  })
  post2.listen(() => {})
  expect(getSize(posts)).toEqual(1)

  await changeSyncMap(post2, 'title', '1')
  expect(getSize(posts)).toEqual(1)

  await changeSyncMap(post2, 'projectId', '1')
  expect(getSize(posts)).toEqual(1)

  await changeSyncMap(post2, 'category', 'test')
  expect(getSize(posts)).toEqual(2)

  await changeSyncMap(post2, 'category', 'wrong')
  expect(getSize(posts)).toEqual(1)

  await deleteSyncMapById(client, LocalPost, '1')
  expect(getSize(posts)).toEqual(0)
})

it('unsubscribes from store on delete', async () => {
  let client = new TestClient('10')
  await client.connect()

  let post = Post('1', client)
  let unbind = post.listen(() => {})

  let posts = createFilter(client, Post, { authorId: '10' })
  posts.listen(() => {})

  await changeSyncMap(post, 'authorId', '10')
  expect(cachedIds(Post)).toEqual(['1'])
  unbind()

  await changeSyncMap(post, 'authorId', '20')
  await delay(1020)

  expect(cachedIds(Post)).toHaveLength(0)
})

it('uses time for delete actions', async () => {
  let client = new TestClient('10')
  await client.connect()

  let oldId = client.log.generateId()

  let posts = createFilter(client, Post)
  posts.listen(() => {})
  await createSyncMap(client, Post, {
    id: 'ID',
    title: '1',
    authorId: '1',
    projectId: '1'
  })
  expect(getSize(posts)).toEqual(1)

  await client.sync({ type: 'posts/delete', id: 'ID' }, { id: oldId, time: 0 })
  expect(getSize(posts)).toEqual(1)

  await client.sync({ type: 'posts/delete', id: 'ID' })
  expect(getSize(posts)).toEqual(0)
})

it('triggers on child changes', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post('1', client)
  post.listen(() => {})
  await changeSyncMap(post, 'authorId', '10')

  let posts = createFilter(client, Post, { authorId: '10' })
  posts.listen(() => {})
  let calls: (string | undefined)[] = []
  posts.subscribe((value, key) => {
    calls.push(key)
  })
  await posts.loading
  expect(calls).toEqual([undefined, 'isLoading'])

  await changeSyncMap(post, 'title', 'New')
  expect(calls).toEqual([undefined, 'isLoading', '1.title'])

  await changeSyncMap(post, 'authorId', '20')
  expect(calls).toEqual([
    undefined,
    'isLoading',
    '1.title',
    '1.authorId',
    'stores',
    'list',
    'isEmpty'
  ])
})

it('can ignore child changes', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post('1', client)
  post.listen(() => {})
  await changeSyncMap(post, 'authorId', '10')

  let posts = createFilter(
    client,
    Post,
    { authorId: '10' },
    { listChangesOnly: true }
  )
  posts.listen(() => {})
  let calls: (string | undefined)[] = []
  posts.subscribe((value, key) => {
    calls.push(key)
  })
  await posts.loading
  expect(calls).toEqual([undefined, 'isLoading'])

  await changeSyncMap(post, 'title', 'New')
  await changeSyncMap(post, 'authorId', '20')
  expect(calls).toEqual([undefined, 'isLoading', 'stores', 'list', 'isEmpty'])
})

it('is ready create/delete/change undo', async () => {
  let client = new TestClient('10')
  await client.connect()

  let posts = createFilter(client, Post, { projectId: '1' })
  posts.listen(() => {})
  await posts.loading

  client.server.undoNext()
  await client.server.freezeProcessing(async () => {
    createSyncMap(client, Post, {
      id: '1',
      title: '1',
      authorId: '1',
      projectId: '1'
    })
    await delay(1)
    expect(getSize(posts)).toEqual(1)
  })
  expect(getSize(posts)).toEqual(0)

  await createSyncMap(client, Post, {
    id: '2',
    title: '2',
    authorId: '1',
    projectId: '1'
  })
  expect(getSize(posts)).toEqual(1)

  client.server.undoNext()
  await client.server.freezeProcessing(async () => {
    deleteSyncMapById(client, Post, '2')
    await delay(1)
    expect(getSize(posts)).toEqual(0)
  })
  expect(getSize(posts)).toEqual(1)

  client.server.undoNext()
  await client.server.freezeProcessing(async () => {
    changeSyncMapById(client, Post, '2', 'projectId', 'wrong')
    await delay(1)
    expect(getSize(posts)).toEqual(0)
  })
  expect(getSize(posts)).toEqual(1)
  expect(getValue(Post('2', client))).toEqual({
    id: '2',
    isLoading: false,
    projectId: '1',
    authorId: '1',
    title: '2'
  })

  let post3 = Post('3', client)
  post3.listen(() => {})
  await post3.loading

  client.server.undoNext()
  await client.server.freezeProcessing(async () => {
    changeSyncMap(post3, 'projectId', '1')
    await delay(1)
    expect(getSize(posts)).toEqual(2)
  })
  expect(getSize(posts)).toEqual(1)

  client.server.undoNext()
  await client.server.freezeProcessing(async () => {
    changeSyncMap(post3, 'projectId', '1')
    client.log.add({
      type: 'posts/changed',
      id: '3',
      fields: { projectId: '1' }
    })
    await delay(1)
    expect(getSize(posts)).toEqual(2)
  })
  expect(getSize(posts)).toEqual(2)

  cleanStores(Post)
  await delay(50)

  expect(client.log.actions()).toEqual([])
})

it('loads store on change action without cache', async () => {
  let client = new TestClient('10')
  await client.connect()

  let posts = createFilter(client, Post)
  posts.listen(() => {})
  expect(
    await client.sent(async () => {
      await client.log.add({
        type: 'posts/change',
        id: '1',
        fields: { title: '1' }
      })
      await client.log.add({
        type: 'posts/changed',
        id: '2',
        fields: { title: '2' }
      })
    })
  ).toEqual([
    { type: 'logux/subscribe', channel: 'posts', filter: {} },
    { type: 'logux/subscribe', channel: 'posts/1' },
    { type: 'logux/subscribe', channel: 'posts/2' }
  ])
  await delay(20)
  expect(getSize(posts)).toEqual(2)
})

it('sorts list', async () => {
  let client = new TestClient('10')
  let posts = createFilter(client, LocalPost, {}, { sortBy: 'title' })
  let changes: string[] = []
  posts.listen((value, key) => {
    changes.push(key)
  })

  await Promise.all([
    createSyncMap(client, LocalPost, { id: '1', title: 'Z', projectId: '1' }),
    createSyncMap(client, LocalPost, { id: '2', title: 'A', projectId: '1' }),
    createSyncMap(client, LocalPost, { id: '5', title: 'E', projectId: '1' }),
    createSyncMap(client, LocalPost, { id: '4', title: 'E', projectId: '1' }),
    createSyncMap(client, LocalPost, { id: '6', title: 'E', projectId: '1' })
  ])
  checkIds(posts, ['2', '4', '5', '6', '1'])
  changes = []

  await deleteSyncMapById(client, LocalPost, '4')
  checkIds(posts, ['2', '5', '6', '1'])
  expect(changes).toEqual(['stores', 'list'])

  await changeSyncMapById(client, LocalPost, '1', 'projectId', '2')
  checkIds(posts, ['2', '5', '6', '1'])
  expect(changes).toEqual(['stores', 'list', '1.projectId'])

  await changeSyncMapById(client, LocalPost, '1', 'title', 'B')
  checkIds(posts, ['2', '1', '5', '6'])
  expect(changes).toEqual(['stores', 'list', '1.projectId', 'list', '1.title'])

  await changeSyncMapById(client, LocalPost, '1', 'title', 'C')
  checkIds(posts, ['2', '1', '5', '6'])
  expect(changes).toEqual([
    'stores',
    'list',
    '1.projectId',
    'list',
    '1.title',
    '1.title'
  ])
})

it('sorts with no children changes', async () => {
  let client = new TestClient('10')
  let posts = createFilter(
    client,
    LocalPost,
    {},
    { sortBy: store => store.title, listChangesOnly: true }
  )
  let changes: string[] = []
  posts.listen((value, key) => {
    changes.push(key)
  })

  await Promise.all([
    createSyncMap(client, LocalPost, { id: '1', title: 'Z', projectId: '1' }),
    createSyncMap(client, LocalPost, { id: '2', title: 'A', projectId: '1' }),
    createSyncMap(client, LocalPost, { id: '5', title: 'E', projectId: '1' }),
    createSyncMap(client, LocalPost, { id: '4', title: 'E', projectId: '1' }),
    createSyncMap(client, LocalPost, { id: '6', title: 'E', projectId: '1' })
  ])
  checkIds(posts, ['2', '4', '5', '6', '1'])
  changes = []

  await deleteSyncMapById(client, LocalPost, '4')
  checkIds(posts, ['2', '5', '6', '1'])
  await delay(1)
  expect(changes).toEqual(['stores', 'list'])

  await changeSyncMapById(client, LocalPost, '1', 'projectId', '2')
  checkIds(posts, ['2', '5', '6', '1'])
  expect(changes).toEqual(['stores', 'list'])

  await changeSyncMapById(client, LocalPost, '1', 'title', 'B')
  await delay(10)
  checkIds(posts, ['2', '1', '5', '6'])
  await delay(1)
  expect(changes).toEqual(['stores', 'list', 'list'])
})

it('is ready for subscription error', async () => {
  let client = new TestClient('10')
  await client.connect()

  let posts = createFilter(client, Post)
  client.server.undoNext()
  let unbind = posts.listen(() => {})

  let catched = false
  posts.loading.catch(e => {
    if (e.name === 'LoguxUndoError') {
      catched = true
    } else {
      throw e
    }
  })

  await delay(10)
  expect(catched).toBe(true)

  expect(
    await client.sent(async () => {
      unbind()
      await delay(10)
    })
  ).toEqual([])
})

it('has shortcut to check size', async () => {
  let client = new TestClient('10')
  await client.connect()

  let posts = createFilter(client, Post, { authorId: '10' })
  posts.listen(() => {})
  expect(getValue(posts).isEmpty).toBe(true)

  await createSyncMap(client, Post, {
    id: '1',
    title: '1',
    authorId: '10',
    projectId: '20'
  })
  expect(getValue(posts).isEmpty).toBe(false)
})
