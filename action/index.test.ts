import { delay } from 'nanodelay'
import { test } from 'uvu'
import { equal, is } from 'uvu/assert'

import { action, allTasks, atom, lastAction, map, onNotify } from '../index.js'

test('shows action name', () => {
  let events: (string | undefined)[] = []
  let store = atom(0)

  onNotify(store, () => {
    events.push(store[lastAction])
  })

  let setProp = action(store, 'setProp', (s, num: number) => {
    s.set(num)
  })

  setProp(1)
  setProp(2)
  setProp(3)
  equal(store.get(), 3)

  equal(events, ['setProp', 'setProp', 'setProp'])
})

test('shows action name for maps', () => {
  let events: (string | undefined)[] = []
  let store = map({ sum: 0 })

  onNotify(store, () => {
    events.push(store[lastAction])
  })

  let setProp = action(store, 'setSum', (s, num: number) => {
    s.setKey('sum', num)
  })

  setProp(1)
  setProp(2)
  setProp(3)
  equal(store.get(), { sum: 3 })

  equal(events, ['setSum', 'setSum', 'setSum'])
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

  counter.set(3)

  equal(events, ['increaseWithDelay', 'increaseWithDelay', undefined])
})

test('track previous actionName correctly', () => {
  let events: (string | undefined)[] = []
  let store = atom(0)

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
