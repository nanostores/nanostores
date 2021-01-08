let { delay } = require('nanodelay')

process.env.NODE_ENV = 'production'

let { RemoteStore, subscribe, change, loaded, loading } = require('../index.js')

it('combines multiple changes for the same store', async () => {
  class TestStore extends RemoteStore {
    constructor (id) {
      super(id)
      this[loaded] = true
      this[loading] = Promise.resolve()
      this.a = 0
      this.b = 0
      this.c = 0
      this.d = 0
    }
  }
  let store = TestStore.load('ID')

  let changes = []
  store[subscribe]((changed, diff) => {
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

it('does not notify about changes while loading', async () => {
  class TestStore extends RemoteStore {
    constructor (id) {
      super(id)
      this[loaded] = false
      this.a = 0
      this.b = 0
      this.c = 0
      this.d = 0
      this[loading] = new Promise(resolve => {
        this.load = resolve
      })
    }
  }
  let store = TestStore.load('ID')
  let events = []
  store[subscribe]((changed, changes) => {
    events.push(changes)
  })

  store[change]('a', 1)
  await delay(1)
  expect(events).toEqual([])

  store[change]('b', 1)
  await delay(1)

  store.load()
  store[change]('c', 1)
  await delay(1)

  store[change]('d', 1)
  await delay(1)

  expect(events).toEqual([{ a: 1, b: 1, c: 1 }, { d: 1 }])
})

it('does not trigger event on request', async () => {
  class TestStore extends RemoteStore {
    constructor (id) {
      super(id)
      this[loaded] = true
      this[loading] = Promise.resolve()
      this.a = 0
      this.b = 0
    }
  }
  let store = TestStore.load('ID')

  let changes = []
  store[subscribe]((changed, diff) => {
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
