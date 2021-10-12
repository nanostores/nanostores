import { delay } from 'nanodelay'

import {
  mapTemplate,
  lastAction,
  actionFor,
  onNotify,
  allTasks,
  action,
  atom
} from '../index.js'

it('shows action name', () => {
  let events: (string | undefined)[] = []
  let store = atom(1)
  onNotify(store, () => {
    events.push(store[lastAction])
  })

  let setProp = action(store, 'setProp', (num: number) => {
    store.set(num)
  })

  setProp(1)
  setProp(2)
  setProp(3)
  expect(events).toEqual(['setProp', 'setProp', 'setProp'])
})

it('supports map templates', () => {
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
  expect(events).toEqual(['add', 'add'])
  expect(store.get()).toEqual({ id: 'id', value: 3 })
})

it('supports async tasks', async () => {
  let counter = atom(0)
  let increaseWithDelay = action(counter, 'increaseWithDelay', async () => {
    await delay(10)
    counter.set(counter.get() + 1)
    return 'result'
  })

  increaseWithDelay()
  expect(counter.get()).toBe(0)
  await allTasks()
  expect(counter.get()).toBe(1)

  expect(await increaseWithDelay()).toBe('result')
  expect(counter.get()).toBe(2)
})
