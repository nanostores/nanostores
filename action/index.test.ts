import { equal, is } from 'uvu/assert'
import { delay } from 'nanodelay'
import { test } from 'uvu'

import {
  mapTemplate,
  lastAction,
  actionFor,
  onNotify,
  allTasks,
  action,
  atom
} from '../index.js'

test('shows action name', () => {
  let events: (string | undefined)[] = []
  let store = atom(1)

  onNotify(store, () => {
    events.push(store[lastAction])
  })

  let setProp = action(store, 'setProp', (s, num: number) => {
    s.set(num)
  })

  setProp(1)
  setProp(2)
  setProp(3)

  equal(events, ['setProp', 'setProp', 'setProp'])
})

test('supports map templates', () => {
  let Counter = mapTemplate<{ value: number }>(store => {
    store.setKey('value', 0)
  })

  let add = actionFor(Counter, 'add', (store, number: number = 1) => {
    store.setKey('value', store.get().value + number)
  })

  let events: (string | undefined)[] = []
  let store = Counter('id')
  store.listen(() => {})
  onNotify(store, () => {
    events.push(store[lastAction])
  })

  add(store)
  add(store, 2)
  equal(events, ['add', 'add'])
  equal(store.get(), { id: 'id', value: 3 })
})

test('supports async tasks', async () => {
  let counter = atom(0)
  let events: (string | undefined)[] = []

  onNotify(counter, () => {
    events.push(counter[lastAction])
  })

  let increaseWithDelay = action(counter, 'increaseWithDelay', async s => {
    await delay(10)
    s.set(s.get() + 1)
    return 'result'
  })

  increaseWithDelay()
  equal(counter.get(), 0)
  await allTasks()
  equal(counter.get(), 1)

  equal(await increaseWithDelay(), 'result')
  equal(counter.get(), 2)

  counter.set(2)

  equal(events, ['increaseWithDelay', 'increaseWithDelay', undefined])
})

test('track previous actionName correctly', () => {
  let events: (string | undefined)[] = []
  let store = atom(1)

  onNotify(store, () => {
    events.push(store[lastAction])
  })

  let setProp = action(store, 'setProp', (s, num: number) => {
    s.set(num)
  })

  setProp(1)
  store.set(2)
  setProp(3)

  equal(events, ['setProp', undefined, 'setProp'])
})

test('allows null', () => {
  let store = atom<{ a: 1 } | null>({ a: 1 })

  let setNull = action(store, 'setNull', s => {
    s.set(null)
  })
  setNull()

  is(store.get(), null)
})

test.run()
