import { TestClient, LoguxUndoError, Client } from '@logux/client'
import { delay } from 'nanodelay'

import {
  SyncMap,
  loaded,
  emitter,
  destroy,
  MapDiff,
  offline,
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

  constructor (client: Client, id: string) {
    super(client, id)
    if (id === 'Offline') this[offline] = true
  }
}

class OfflinePost extends SyncMap {
  static remote = false
  static offline = true
  static plural = 'offlinePosts'
  title?: string
}

function changeAction (diff: MapDiff<Post>, id = 'ID') {
  return { type: 'posts/change', id, diff }
}

function changedAction (diff: MapDiff<Post>, id = 'ID') {
  return { type: 'posts/changed', id, diff }
}

it('has default plural', () => {
  let client = new TestClient('10')
  class NamelessStore extends SyncMap {}
  new NamelessStore(client, '10')
  expect(NamelessStore.plural).toEqual('@logux/maps')
})

it('subscribes and unsubscribes', async () => {
  let client = new TestClient('10')
  await client.connect()

  let post: Post | undefined
  await client.server.freezeProcessing(async () => {
    post = new Post(client, 'ID')
    expect(post[loaded]).toBe(false)
  })
  if (!post) throw new Error('User is empty')

  await delay(10)
  expect(post[loaded]).toBe(true)
  expect(client.subscribed('posts/ID')).toBe(true)

  post[destroy]()
  await delay(10)
  expect(client.subscribed('posts/ID')).toBe(false)
})

it('changes key', async () => {
  let client = new TestClient('10')
  await client.connect()

  let post = new Post(client, 'ID')
  let changes: MapDiff<Post>[] = []
  post[emitter].on('change', (store, diff) => {
    changes.push(diff)
  })

  expect(post.title).toBeUndefined()
  expect(post.category).toEqual('none')

  post.change('title', '1')
  post.change('category', 'demo')
  expect(post.title).toEqual('1')
  expect(post.category).toEqual('demo')
  expect(changes).toEqual([{ title: '1' }, { category: 'demo' }])

  await delay(10)
  let actions = await client.sent(async () => {
    await post.change('title', '2')
  })
  expect(actions).toEqual([changeAction({ title: '2' })])

  await client.log.add(changeAction({ title: '3' }))
  expect(post.title).toEqual('3')

  client.server.log.add(changedAction({ title: '4' }))
  await delay(10)
  expect(post.title).toEqual('4')

  expect(changes).toEqual([
    { title: '1' },
    { category: 'demo' },
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
  let post = new Post(client, 'ID')

  await post.change('title', '1')
  await post.change('title', '2')

  post[destroy]()
  await delay(10)
  expect(client.log.actions()).toEqual([])
})

it('returns Promise on changing', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post(client, 'ID')

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
  let post = new Post(client, 'ID')

  await post.change('title', 'New')
  await client.log.add(changeAction({ title: 'Old 1' }), { time: 0 })
  await client.server.log.add(changedAction({ title: 'Old 2' }), { time: 0 })
  await delay(10)

  expect(post.title).toEqual('New')
  expect(client.log.actions()).toEqual([changeAction({ title: 'New' })])
})

it('reverts changes for simple case', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post(client, 'ID')

  let changes: string[] = []
  post[emitter].on('change', (store, diff) => {
    changes.push(diff.title)
  })

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
  let post = new Post(client, 'ID')

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

  let post1 = new Post(client, '1')
  let post2 = new Post(client, '2')

  await post1.change('title', 'A')
  await post2.change('title', 'B')
  await client.log.add(changedAction({ title: 'C' }, '2'))

  client.server.undoNext()
  post1.change('title', 'Bad')
  await delay(10)

  expect(post1.title).toEqual('A')
  expect(post2.title).toEqual('C')
})

it('does not allow to change keys manually', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post(client, 'ID')

  await post.change('title', '1')

  let error = await catchError(() => {
    post.title = '2'
  })
  expect(error.message).toContain("read only property 'title'")
})

it('does not emit events on non-changes', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post(client, 'ID')

  let changes: (string | undefined)[] = []
  post[emitter].on('change', () => {
    changes.push(post.title)
  })

  await post.change('title', '1')
  await post.change('title', '1')

  expect(changes).toEqual(['1'])
})

it('supports bulk changes', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post(client, 'ID')

  let changes: MapDiff<Post>[] = []
  post[emitter].on('change', (store, diff) => {
    changes.push(diff)
  })

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
  await delay(10)

  expect(post.title).toEqual('3')
  expect(post.category).toEqual('demo')
  expect(post.author).toEqual('Yaropolk')
  expect(changes).toEqual([
    { title: '1', category: 'demo' },
    { title: '3' },
    { author: 'Yaropolk' },
    { category: 'bad', author: 'Badly' },
    { author: 'Yaropolk' },
    { category: 'demo' }
  ])
})

it('could cache specific instances', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post(client, 'Offline')

  await post.change('title', 'The post')
  await post.change('category', 'demo')
  await delay(10)

  post[destroy]()
  await delay(10)

  expect(client.log.actions()).toEqual([
    changedAction({ title: 'The post' }, 'Offline'),
    changedAction({ category: 'demo' }, 'Offline')
  ])

  let other = new Post(client, 'Other')
  await other.change('title', 'Other post')
  other[destroy]()
  await delay(10)

  let restore: Post | undefined
  let creating = await client.sent(() => {
    restore = new Post(client, 'Offline')
  })
  if (!restore) throw new Error('post is empty')
  expect(creating).toEqual([])
  await restore[loading]
  await delay(10)
  expect(restore.title).toEqual('The post')
})

it('could cache specific stores without server', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post: OfflinePost | undefined

  let sent = await client.sent(async () => {
    post = new OfflinePost(client, 'ID')
    await post.change('title', 'The post')
  })
  if (!post) throw new Error('post is empty')
  expect(sent).toEqual([])

  post[destroy]()
  await delay(10)

  let restore = new OfflinePost(client, 'ID')
  await restore[loading]
  await delay(10)
  expect(restore.title).toEqual('The post')
})

it('throws on wrong offline marker', async () => {
  let client = new TestClient('10')
  class WrongStore extends SyncMap {
    static [offline] = true
  }
  expect(() => {
    new WrongStore(client, 'ID')
  }).toThrow(
    'Replace `static [error] = true` to `static error = true` in WrongStore'
  )
})
