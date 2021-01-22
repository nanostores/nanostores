import { TestClient } from '@logux/client'
import { delay } from 'nanodelay'

import { FilterStore, cleanStores, SyncMap, Store } from '../index.js'

class Post extends SyncMap {
  static plural = 'posts'
  title!: string
  authorId!: string
  projectId!: string
}

class LocalPost extends SyncMap {
  static plural = 'local'
  static offline = true
  static remote = false
  title!: string
  projectId!: string
  category?: string
}

class CachedPost extends SyncMap {
  static plural = 'cached'
  static offline = true
  title!: string
  projectId!: string
}

class User extends SyncMap {
  static plural = 'users'
  name!: string
  projectId!: string
}

afterEach(async () => {
  await cleanStores(FilterStore, Post, LocalPost, CachedPost)
})

function cleanOnNoListener (store: Store) {
  store.subscribe(() => {})()
}

function privateMethods (obj: any) {
  return obj
}

it('caches filters', () => {
  let client = new TestClient('10')
  let filter1 = FilterStore.filter(client, Post, { projectId: '10' })
  let filter2 = FilterStore.filter(client, Post, { projectId: '10' })
  let filter3 = FilterStore.filter(client, Post, { projectId: '20' })
  let filter4 = FilterStore.filter(client, User, { projectId: '20' })

  expect(filter1).toBe(filter2)
  expect(filter1).not.toBe(filter3)
  expect(filter1).not.toBe(filter4)

  expect(client.log.actions()).toHaveLength(3)
})

it('throws on missed Store.plural', () => {
  let client = new TestClient('10')
  class Test extends SyncMap {}
  expect(() => {
    FilterStore.filter(client, Test)
  }).toThrow('Set Test.plural')
})

it('looks for already loaded stores', async () => {
  let client = new TestClient('10')
  let post1 = Post.load('1', client)
  let post2 = Post.load('2', client)
  let post3 = Post.load('3', client)
  let post4 = Post.load('4', client)

  post1.change({ projectId: '100', authorId: '10' })
  post2.change({ projectId: '100', authorId: '10' })
  post3.change({ projectId: '200', authorId: '10' })
  post4.change({ projectId: '100', authorId: '11' })

  let posts = FilterStore.filter(client, Post, {
    projectId: '100',
    authorId: '10'
  })
  expect(posts.stores).toEqual(
    new Map([
      ['1', post1],
      ['2', post2]
    ])
  )
  expect(posts.isLoading).toBe(true)
})

it('subscribes to channels for remote stores', async () => {
  let client = new TestClient('10')
  client.keepActions()
  await client.connect()

  let resolved = false
  let posts: FilterStore<Post> | undefined
  await client.server.freezeProcessing(async () => {
    posts = FilterStore.filter(client, Post, { projectId: '1' })
    posts.storeLoading.then(() => {
      resolved = true
    })
    await delay(1)
    expect(client.log.actions()).toEqual([
      { type: 'logux/subscribe', channel: 'posts', filter: { projectId: '1' } }
    ])
    expect(resolved).toBe(false)
  })
  expect(resolved).toBe(true)
  expect(posts?.isLoading).toBe(false)

  expect(
    await client.sent(async () => {
      await cleanStores(FilterStore)
    })
  ).toEqual([
    { type: 'logux/unsubscribe', channel: 'posts', filter: { projectId: '1' } }
  ])

  expect(
    await client.sent(async () => {
      FilterStore.filter(client, CachedPost, { projectId: '1' })
      await cleanStores(FilterStore)
    })
  ).toEqual([
    { type: 'logux/subscribe', channel: 'cached', filter: { projectId: '1' } },
    { type: 'logux/unsubscribe', channel: 'cached', filter: { projectId: '1' } }
  ])

  expect(
    await client.sent(async () => {
      FilterStore.filter(client, LocalPost, { projectId: '1' })
      await cleanStores(FilterStore)
    })
  ).toEqual([])
})

it('loads store from the log for offline stores', async () => {
  let client = new TestClient('10')
  client.keepActions()
  await LocalPost.create(client, {
    id: '1',
    title: 'Post 1a',
    projectId: '10'
  })
  await LocalPost.delete(client, '1')

  await LocalPost.create(client, {
    id: '1',
    title: 'Post 1b',
    projectId: '20'
  })

  await LocalPost.create(client, {
    id: '2',
    title: 'Post 2',
    projectId: '20'
  })
  let post2 = LocalPost.load('2', client)
  await post2.storeLoading
  await post2.change('projectId', '10')
  await post2.change('projectId', '30')

  await LocalPost.create(client, {
    id: '3',
    title: 'Post 3',
    projectId: '10'
  })
  await LocalPost.delete(client, '3')

  await LocalPost.create(client, {
    id: '4',
    title: 'Post 4',
    projectId: '20'
  })
  let post4 = LocalPost.load('4', client)
  await post4.storeLoading
  await post4.change('projectId', '10')

  await LocalPost.create(client, {
    id: '5',
    title: 'Post 5',
    projectId: '10'
  })
  let post5 = LocalPost.load('5', client)
  await post5.storeLoading

  await cleanStores(LocalPost)

  let posts = FilterStore.filter(client, LocalPost, { projectId: '10' })
  await posts.storeLoading
  expect(posts.isLoading).toBe(false)
  expect(Array.from(posts.stores.keys()).sort()).toEqual(['4', '5'])
  await delay(1)
  expect(LocalPost.loaded.size).toEqual(2)
})

it('supports both offline and remote stores', async () => {
  let client = new TestClient('10')
  client.keepActions()
  await client.connect()

  await CachedPost.create(client, { id: 'ID', projectId: '1', title: '1' })
  await cleanStores(CachedPost)

  let posts: FilterStore<CachedPost> | undefined
  await client.server.freezeProcessing(async () => {
    posts = FilterStore.filter(client, CachedPost, { projectId: '1' })
    await delay(10)
    expect(posts.stores.size).toEqual(1)
    expect(posts.isLoading).toBe(true)
  })
  if (!posts) throw new Error('No posts')
  await delay(10)
  expect(posts.isLoading).toBe(false)
  expect(Array.from(posts.stores.keys())).toEqual(['ID'])
})

it('keeps stores in memory and unsubscribes on destroy', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post.load('1', client)
  post.change('authorId', '10')

  let posts = FilterStore.filter(client, Post, { authorId: '10' })

  cleanOnNoListener(post)
  await delay(20)
  expect(Post.loaded.size).toEqual(1)

  cleanOnNoListener(posts)
  await delay(20)
  expect(Post.loaded.size).toEqual(0)
})

it('updates list on store create/deleted/change', async () => {
  let client = new TestClient('10')
  await client.connect()

  let posts = FilterStore.filter(client, Post, {
    authorId: '1',
    projectId: '1'
  })
  let changes = 0
  posts.addListener((store, diff) => {
    expect(store).toBe(posts)
    expect(diff.stores).toEqual(posts.stores)
    changes += 1
  })

  await posts.storeLoading
  expect(posts.stores.size).toEqual(0)
  expect(changes).toEqual(0)

  await Post.create(client, {
    id: '1',
    title: '1',
    projectId: '1',
    authorId: '1'
  })
  expect(posts.stores.size).toEqual(1)
  expect(changes).toEqual(1)

  await Post.create(client, {
    id: '2',
    title: '2',
    projectId: '2',
    authorId: '2'
  })
  let post2 = Post.load('2', client)
  post2.subscribe(() => {})
  await post2.storeLoading
  expect(posts.stores.size).toEqual(1)

  await post2.change('title', '1')
  expect(posts.stores.size).toEqual(1)

  await post2.change('projectId', '1')
  expect(posts.stores.size).toEqual(1)

  await post2.change('authorId', '1')
  expect(posts.stores.size).toEqual(2)
  expect(changes).toEqual(2)

  await post2.change('authorId', '2')
  expect(posts.stores.size).toEqual(1)
  expect(changes).toEqual(3)

  await Post.delete(client, '1')
  expect(posts.stores.size).toEqual(0)
  expect(changes).toEqual(4)
})

it('updates list on store created/deleted/changed', async () => {
  let client = new TestClient('10')
  client.keepActions()

  let posts = FilterStore.filter(client, LocalPost, {
    category: 'test',
    projectId: '1'
  })

  await posts.storeLoading
  expect(posts.stores.size).toEqual(0)

  await LocalPost.create(client, {
    id: '1',
    title: '1',
    projectId: '1',
    category: 'test'
  })
  expect(posts.stores.size).toEqual(1)

  await LocalPost.create(client, {
    id: '2',
    title: '2',
    projectId: '2',
    category: 'wrong'
  })
  let post2 = LocalPost.load('2', client)
  post2.subscribe(() => {})
  await post2.storeLoading
  expect(posts.stores.size).toEqual(1)

  await post2.change('title', '1')
  expect(posts.stores.size).toEqual(1)

  await post2.change('projectId', '1')
  expect(posts.stores.size).toEqual(1)

  await post2.change('category', 'test')
  expect(posts.stores.size).toEqual(2)

  await post2.change('category', 'wrong')
  expect(posts.stores.size).toEqual(1)

  await LocalPost.delete(client, '1')
  expect(posts.stores.size).toEqual(0)
})

it('unsubscribes from store on delete', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post.load('1', client)
  post.change('authorId', '10')

  FilterStore.filter(client, Post, { authorId: '10' })
  await post.change('authorId', '20')
  await delay(1)

  expect(Post.loaded.size).toEqual(0)
})

it('uses time for delete actions', async () => {
  let client = new TestClient('10')
  await client.connect()

  let oldId = client.log.generateId()

  let posts = FilterStore.filter(client, Post)
  await Post.create(client, {
    id: 'ID',
    title: '1',
    authorId: '1',
    projectId: '1'
  })
  expect(posts.stores.size).toEqual(1)

  await client.sync({ type: 'posts/delete', id: 'ID' }, { id: oldId, time: 0 })
  expect(posts.stores.size).toEqual(1)

  await client.sync({ type: 'posts/delete', id: 'ID' })
  expect(posts.stores.size).toEqual(0)
})

it('does not trigger change on item changes', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = Post.load('1', client)
  post.change('authorId', '10')

  let posts = FilterStore.filter(client, Post, { authorId: '10' })
  let changes = 0
  posts.addListener(() => {
    changes += 1
  })

  await delay(1)
  expect(changes).toEqual(1)

  await post.change('title', 'New')
  expect(changes).toEqual(1)

  await post.change('authorId', '20')
  expect(changes).toEqual(2)
})

it('is ready create/delete/change undo', async () => {
  let client = new TestClient('10')
  await client.connect()

  let posts = FilterStore.filter(client, Post, { projectId: '1' })
  await posts.storeLoading

  client.server.undoNext()
  await client.server.freezeProcessing(async () => {
    Post.create(client, {
      id: '1',
      title: '1',
      authorId: '1',
      projectId: '1'
    })
    await delay(1)
    expect(posts.stores.size).toEqual(1)
  })
  expect(posts.stores.size).toEqual(0)

  await Post.create(client, {
    id: '2',
    title: '2',
    authorId: '1',
    projectId: '1'
  })
  expect(posts.stores.size).toEqual(1)

  client.server.undoNext()
  await client.server.freezeProcessing(async () => {
    posts.stores.get('2')?.delete()
    await delay(1)
    expect(posts.stores.size).toEqual(0)
  })
  expect(posts.stores.size).toEqual(1)

  client.server.undoNext()
  await client.server.freezeProcessing(async () => {
    posts.stores.get('2')?.change('projectId', 'wrong')
    await delay(1)
    expect(posts.stores.size).toEqual(0)
  })
  expect(posts.stores.size).toEqual(1)
  expect(posts.stores.get('2')?.projectId).toEqual('1')

  let post3 = Post.load('3', client)
  post3.subscribe(() => {})
  await post3.storeLoading

  client.server.undoNext()
  await client.server.freezeProcessing(async () => {
    post3.change('projectId', '1')
    await delay(1)
    expect(posts.stores.size).toEqual(2)
  })
  expect(posts.stores.size).toEqual(1)

  client.server.undoNext()
  await client.server.freezeProcessing(async () => {
    post3.change('projectId', '1')
    client.log.add({
      type: 'posts/changed',
      id: '3',
      fields: { projectId: '1' }
    })
    await delay(1)
    expect(posts.stores.size).toEqual(2)
  })
  expect(posts.stores.size).toEqual(2)

  await cleanStores(FilterStore, Post)
  await delay(50)

  expect(client.log.actions()).toEqual([])
})

it('protects list from double-adding or double-removing', async () => {
  let client = new TestClient('10')
  await client.connect()

  let posts = FilterStore.filter(client, Post)
  await Post.create(client, {
    id: 'ID',
    title: '1',
    authorId: '1',
    projectId: '1'
  })
  expect(posts.stores.size).toEqual(1)

  privateMethods(posts).add(posts.stores.get('ID'))
  expect(posts.stores.size).toEqual(1)

  privateMethods(posts).remove('ID')
  expect(posts.stores.size).toEqual(0)
  privateMethods(posts).remove('ID')
})

it('loads store on change action without cache', async () => {
  let client = new TestClient('10')
  await client.connect()

  let posts = FilterStore.filter(client, Post)
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
  expect(posts.stores.size).toEqual(2)
})
