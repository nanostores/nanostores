import { TestClient, Client } from '@logux/client'
import { delay } from 'nanodelay'

import {
  loadRemoteStore,
  RemoteStore,
  LocalStore,
  loading,
  emitter,
  loaded,
  destroy
} from '../index.js'

it('throws an error on store', () => {
  class TestLocalStore extends LocalStore {}
  expect(() => {
    loadRemoteStore(
      new TestClient('10'),
      // @ts-expect-error
      TestLocalStore,
      'ID',
      () => {},
      () => {}
    )
  }).toThrow(
    'TestLocalStore is a local store and should be created ' +
      'with createLocalStore()'
  )
})

it('creates store only once', () => {
  let client = new TestClient('10')
  let calls: string[] = []
  class TestStore extends RemoteStore {
    test = 1;

    [loaded] = true;
    [loading] = Promise.resolve()

    constructor (c: Client, id: string) {
      super(c, id)
      calls.push('constructor')
    }

    change () {
      calls.push('change')
      this[emitter].emit('change', this)
    }

    [destroy] () {
      calls.push('destroy')
    }
  }

  let unbind1 = loadRemoteStore(
    client,
    TestStore,
    'test:1',
    store => {
      calls.push(`a:${store.id}`)
    },
    () => {}
  )
  let unbind2 = loadRemoteStore(
    client,
    TestStore,
    'test:1',
    store => {
      calls.push(`b:${store.id}`)
    },
    () => {}
  )

  let store = client.objects.get('test:1') as TestStore
  store.change()
  unbind1()

  store.change()
  expect(client.objects.has('test:1')).toBe(true)
  unbind2()
  store.change()
  expect(client.objects.has('test:1')).toBe(false)

  expect(calls).toEqual([
    'constructor',
    'a:test:1',
    'b:test:1',
    'change',
    'a:test:1',
    'b:test:1',
    'change',
    'b:test:1',
    'destroy',
    'change'
  ])
  expect(client.objects.size).toEqual(0)
})

it('subscribes to loading store', async () => {
  let client = new TestClient('10')
  let calls = 0
  class TestStore extends RemoteStore {
    resolve = () => {};

    [loaded] = false;
    [loading] = new Promise<void>(resolve => {
      this.resolve = resolve
    })

    change () {
      this[emitter].emit('change', this)
    }
  }

  loadRemoteStore(
    client,
    TestStore,
    'id',
    () => {
      calls += 1
    },
    () => {}
  )

  await delay(1)
  expect(calls).toEqual(0)

  let store = client.objects.get('id') as TestStore
  store.change()
  expect(calls).toEqual(0)

  store.resolve()
  await delay(1)
  expect(calls).toEqual(1)

  store.change()
  expect(calls).toEqual(2)
})

it('throws on error during loading', async () => {
  let client = new TestClient('10')
  let error = new Error('test')
  let calls: string[] = []

  class BrokenStore extends RemoteStore {
    [loaded] = false;
    [loading] = Promise.reject(error)
  }

  loadRemoteStore(
    client,
    BrokenStore,
    'id',
    () => {
      calls.push('listener')
    },
    e => {
      calls.push(`error ${e.message}`)
    }
  )

  await delay(1)
  expect(calls).toEqual(['error test'])

  let store = client.objects.get('id') as BrokenStore
  store[emitter].emit('change')
  expect(calls).toEqual(['error test'])
})
