import { delay } from 'nanodelay'

import { LocalStore, triggerChanges, subscribe } from '../index.js'

it('combines multiple changes for the same store', async () => {
  class TestStore extends LocalStore {}
  let store = TestStore.load()

  let changes: object[] = []
  store[subscribe]((_, diff) => {
    changes.push(diff)
  })

  triggerChanges(store, { a: 1 })
  expect(changes).toEqual([])
  await delay(1)
  expect(changes).toEqual([{ a: 1 }])

  triggerChanges(store, { b: 2, c: 2 })
  triggerChanges(store, { c: 3, d: 3 })
  triggerChanges(store)
  await delay(1)
  expect(changes).toEqual([{ a: 1 }, { b: 2, c: 3, d: 3 }])
})
