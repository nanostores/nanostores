import { Client, TestClient } from '@logux/client'
import { delay } from 'nanodelay'

import { LocalStore, change, destroy } from '../index.js'

it('loads store only once', () => {
  class StoreA extends LocalStore {}
  class StoreB extends LocalStore {}
  let storeA1 = StoreA.load()
  let storeA2 = StoreA.load()
  let storeB = StoreB.load()
  expect(storeA1).toBe(storeA2)
  expect(storeB).not.toBe(storeA2)
})

it('destroys store when all listeners unsubscribed', async () => {
  let events: string[] = []
  class TestStore extends LocalStore {
    value = 0

    constructor () {
      super()
      events.push('constructor')
    }

    [destroy] () {
      events.push('destroy')
    }
  }

  let store = TestStore.load()
  let unbind1 = store.subscribe((changed, diff) => {
    expect(changed).toBe(store)
    events.push('change 1 ' + Object.keys(diff).join(' '))
  })
  let unbind2 = store.subscribe(() => {
    events.push('change 2')
  })

  store[change]('value', 1)
  await delay(1)
  unbind1()
  store[change]('value', 2)
  await delay(1)

  unbind2()
  expect(TestStore.loaded).toBeDefined()

  let unbind3 = store.subscribe(() => {
    events.push('change 3')
  })
  store[change]('value', 4)
  await delay(1)

  unbind3()
  await delay(1)
  expect(TestStore.loaded).toBeUndefined()
  expect(events).toEqual([
    'constructor',
    'change 1 value',
    'change 2',
    'change 2',
    'change 3',
    'destroy'
  ])
})

it('supports stores without destroy', async () => {
  class TestStore extends LocalStore {}
  let unbind = TestStore.subscribe(() => {})
  unbind()
  await delay(1)
  expect(TestStore.loaded).toBeUndefined()
})

it('does not allow to change keys', async () => {
  class TestStore extends LocalStore {
    value = 0
  }
  let store = TestStore.load()
  store[change]('value', 1)
  expect(() => {
    store.value = 2
  }).toThrow(/Cannot assign to read only property 'value'/)
})

it('combines multiple changes for the same store', async () => {
  class TestStore extends LocalStore {
    a = 0
    b = 0
    c = 0
    d = 0
  }
  let store = TestStore.load()

  let changes: object[] = []
  store.subscribe((changed, diff) => {
    expect(changed).toBe(store)
    changes.push(diff)
  })

  store[change]('a', 1)
  expect(store.a).toEqual(1)
  expect(changes).toEqual([])
  await delay(1)
  expect(changes).toEqual([{ a: 1 }])

  store[change]('b', 2)
  store[change]('c', 2)
  store[change]('c', 3)
  store[change]('d', 3)
  await delay(1)
  expect(changes).toEqual([{ a: 1 }, { b: 2, c: 3, d: 3 }])

  store[change]('d', 3)
  await delay(1)
  expect(changes).toEqual([{ a: 1 }, { b: 2, c: 3, d: 3 }])
})

it('does not trigger event on request', async () => {
  class TestStore extends LocalStore {
    a = 0
    b = 0
  }
  let store = TestStore.load()

  let changes: object[] = []
  store.subscribe((changed, diff) => {
    expect(changed).toBe(store)
    changes.push(diff)
  })

  store[change]('a', 1, true)
  await delay(1)
  expect(store.a).toEqual(1)
  expect(changes).toEqual([])

  store[change]('b', 1)
  await delay(1)
  expect(changes).toEqual([{ b: 1 }])
})

it('passes client', () => {
  class TestStore extends LocalStore {
    constructor (c: Client) {
      super(c)
      expect(c.options.userId).toEqual('10')
    }
  }
  let client = new TestClient('10')
  TestStore.load(client)
})
