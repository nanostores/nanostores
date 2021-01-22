let { delay } = require('nanodelay')

process.env.NODE_ENV = 'production'

let { LocalStore } = require('../index.js')

it('combines multiple changes for the same store', async () => {
  class TestStore extends LocalStore {
    constructor () {
      super()
      this.a = 0
      this.b = 0
      this.c = 0
      this.d = 0
    }
  }
  let store = TestStore.load()

  let changes = []
  store.subscribe((_, diff) => {
    changes.push(diff)
  })

  store.changeKey('a', 1)
  expect(store.a).toEqual(1)
  expect(changes).toEqual([])
  await delay(1)
  expect(changes).toEqual([{ a: 1 }])

  store.changeKey('b', 2)
  store.changeKey('c', 2)
  store.changeKey('c', 3)
  store.changeKey('d', 3)
  await delay(1)
  expect(changes).toEqual([{ a: 1 }, { b: 2, c: 3, d: 3 }])

  store.changeKey('d', 3)
  await delay(1)
  expect(changes).toEqual([{ a: 1 }, { b: 2, c: 3, d: 3 }])
})

it('does not trigger event on request', async () => {
  class TestStore extends LocalStore {
    constructor () {
      super()
      this.a = 0
      this.b = 0
    }
  }
  let store = TestStore.load()

  let changes = []
  store.subscribe((changed, diff) => {
    expect(changed).toBe(store)
    changes.push(diff)
  })

  store.changeKey('a', 1, true)
  await delay(1)
  expect(store.a).toEqual(1)
  expect(changes).toEqual([])

  store.changeKey('b', 1)
  await delay(1)
  expect(changes).toEqual([{ b: 1 }])
})
