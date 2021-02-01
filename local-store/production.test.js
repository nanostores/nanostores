import { delay } from 'nanodelay'

import '../test/set-production.js'
import { LocalStore } from '../index.js'

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
  store.addListener((_, diff) => {
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
