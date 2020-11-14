import { TestClient, Client } from '@logux/client'

import {
  createLocalStore,
  RemoteStore,
  loguxClient,
  LocalStore,
  loading,
  emitter,
  loaded,
  destroy
} from '../index.js'

it('throws an error on remote store', () => {
  class TestRemoteStore extends RemoteStore {
    [loaded] = true;
    [loading] = Promise.resolve()
  }
  expect(() => {
    // @ts-expect-error
    createLocalStore(new TestClient('10'), TestRemoteStore, () => {})
  }).toThrow(
    'TestRemoteStore is a remote store and should be loaded ' +
      'with loadRemoteStore()'
  )
})

it('creates store only once', () => {
  let client = new TestClient('10')
  let calls: string[] = []
  class TestStore extends LocalStore {
    test = 1

    constructor (c: Client) {
      super(c)
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
  let unbind1 = createLocalStore(client, TestStore, store => {
    expect(store[loguxClient]).toBe(client)
    expect(store.test).toEqual(1)
    calls.push('a')
  })
  let unbind2 = createLocalStore(client, TestStore, () => {
    calls.push('b')
  })

  let store = client.objects.get(TestStore) as TestStore
  store.change()
  unbind1()

  store.change()
  unbind2()
  store.change()

  expect(calls).toEqual([
    'constructor',
    'a',
    'b',
    'change',
    'a',
    'b',
    'change',
    'b',
    'destroy',
    'change'
  ])
  expect(client.objects.size).toEqual(0)
})
