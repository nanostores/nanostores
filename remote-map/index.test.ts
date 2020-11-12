import { TestClient, LoguxUndoError } from '@logux/client'
import { delay } from 'nanodelay'

import { RemoteMap, loaded, emitter, destroy } from '../index.js'

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

class Post extends RemoteMap {
  static modelsName = 'posts'

  title?: string
  category = 'none'
}

function changeAction (value: string, key = 'title') {
  return { type: 'posts/change', id: 'ID', key, value }
}

function changedAction (value: string, key = 'title') {
  return { type: 'posts/changed', id: 'ID', key, value }
}

it('has default modelsName', () => {
  let client = new TestClient('10')
  class NamelessModel extends RemoteMap {}
  new NamelessModel(client, '10')
  expect(NamelessModel.modelsName).toEqual('@logux/maps')
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

  client.destroy()
  await delay(10)
  expect(client.subscribed('posts/ID')).toBe(false)
})

it('changes keys', async () => {
  let client = new TestClient('10')
  await client.connect()

  let post = new Post(client, 'ID')
  let changes: string[] = []
  post[emitter].on('change', (model, key) => {
    changes.push(model[key])
  })

  expect(post.title).toBeUndefined()
  expect(post.category).toEqual('none')

  post.change('title', '1')
  post.change('category', 'demo')
  expect(post.title).toEqual('1')
  expect(post.category).toEqual('demo')
  expect(changes).toEqual(['1', 'demo'])

  await delay(10)
  let actions = await client.sent(async () => {
    await post.change('title', '2')
  })
  expect(actions).toEqual([changeAction('2')])

  await client.log.add({
    type: 'posts/change',
    id: 'ID',
    key: 'title',
    value: '3'
  })
  expect(post.title).toEqual('3')

  client.server.log.add(changedAction('4'))
  await delay(10)
  expect(post.title).toEqual('4')

  expect(changes).toEqual(['1', 'demo', '2', '3', '4'])
  expect(client.log.actions()).toEqual([
    changeAction('demo', 'category'),
    changedAction('4')
  ])
})

it('cleans log on unsubscribing', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post(client, 'ID')

  await post.change('title', '1')
  await post.change('title', '2')

  post[destroy]()
  await delay(1)
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
  await client.log.add(changeAction('Old 1'), { time: 0 })
  await client.server.log.add(changedAction('Old 2'), { time: 0 })
  await delay(10)

  expect(post.title).toEqual('New')
  expect(client.log.actions()).toEqual([changeAction('New')])
})

it('reverts changes for simple case', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post(client, 'ID')

  let changes: string[] = []
  post[emitter].on('change', (model, key) => {
    changes.push(model[key])
  })

  await post.change('title', 'Good')

  client.server.undoNext()
  let promise = post.change('title', 'Bad')
  expect(post.title).toEqual('Bad')

  let error = await catchError(() => promise)
  expect(error.message).toEqual('Server undid posts/change because of error')
  await delay(10)
  expect(post.title).toEqual('Good')
  expect(client.log.actions()).toEqual([changeAction('Good')])
  expect(changes).toEqual(['Good', 'Bad', 'Good'])
})

it('reverts changes for multiple actions case', async () => {
  let client = new TestClient('10')
  await client.connect()
  let post = new Post(client, 'ID')

  client.server.undoAction(changeAction('Bad'))
  await post.change('title', 'Good 1')
  await client.server.freezeProcessing(async () => {
    post.change('title', 'Bad')
    await delay(10)
    await client.log.add(changedAction('Good 2'), { time: 4 })
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
  await client.log.add({
    type: 'posts/changed',
    id: '2',
    key: 'title',
    value: 'C'
  })

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
