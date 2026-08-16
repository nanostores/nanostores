import { deepStrictEqual, equal } from 'node:assert'
import { test } from 'node:test'

import { deepMap, listenKeys, map, subscribeKeys } from '../index.js'

test('listen for specific keys', () => {
  let events: string[] = []
  let $store = map({ a: 1, b: 1 })

  let unbind = listenKeys($store, ['a'], (value, _, changed) => {
    equal(changed, 'a')
    events.push(`${value.a} ${value.b}`)
  })
  deepStrictEqual(events, [])

  $store.setKey('b', 2)
  deepStrictEqual(events, [])

  $store.setKey('a', 2)
  deepStrictEqual(events, ['2 2'])

  $store.setKey('a', 3)
  deepStrictEqual(events, ['2 2', '3 2'])

  $store.setKey('b', 3)
  deepStrictEqual(events, ['2 2', '3 2'])

  unbind()
  $store.setKey('a', 4)
  deepStrictEqual(events, ['2 2', '3 2'])
})

test('does not fire when whole-store set leaves watched keys unchanged', () => {
  let events: string[] = []
  let $store = map({ a: 1, b: 2, c: 3 })

  listenKeys($store, ['a', 'b'], (value, _, changed) => {
    events.push(String(changed))
  })
  deepStrictEqual(events, [])

  // Replace entire store but only change 'c' — watched keys 'a' and 'b' are untouched
  $store.set({ a: 1, b: 2, c: 99 })
  deepStrictEqual(events, [], 'should not fire when watched keys did not change')

  // Replace store and change 'b' — should fire
  $store.set({ a: 1, b: 99, c: 99 })
  deepStrictEqual(events, ['undefined'])

  // Replace store and change 'a' — should fire
  $store.set({ a: 99, b: 99, c: 99 })
  deepStrictEqual(events, ['undefined', 'undefined'])
})

test('fires for whole-store set when a watched key is newly added', () => {
  let events: string[] = []
  let $store = map<{ a?: number; b: number }>({ b: 1 })

  listenKeys($store, ['a'], (value, _, changed) => {
    events.push(String(changed))
  })
  deepStrictEqual(events, [])

  // Whole-store set introduces key 'a' for the first time
  $store.set({ a: 1, b: 1 })
  deepStrictEqual(events, ['undefined'])
})

test('fires for whole-store set when a watched key is removed', () => {
  let events: string[] = []
  let $store = map<{ a?: number; b: number }>({ a: 1, b: 1 })

  listenKeys($store, ['a'], (value, _, changed) => {
    events.push(String(changed))
  })
  deepStrictEqual(events, [])

  // Whole-store set removes key 'a'
  $store.set({ b: 1 })
  deepStrictEqual(events, ['undefined'])
})

test('fires when a notification carries no old value', () => {
  let events: string[] = []
  let $store = map({ a: 1, b: 2 })

  listenKeys($store, ['a'], (value, oldValue, changed) => {
    events.push(`${value.a} ${oldValue?.a} ${changed}`)
  })
  deepStrictEqual(events, [])

  // Nothing to compare against, so a watched key may have changed
  $store.notify()
  deepStrictEqual(events, ['1 undefined undefined'])
})

test('never fires without watched keys', () => {
  let events: string[] = []
  let $store = map({ a: 1, b: 2 })

  listenKeys($store, [], (value, oldValue, changed) => {
    events.push(`${value.a} ${oldValue?.a} ${changed}`)
  })

  $store.notify()
  $store.set({ a: 9, b: 9 })
  deepStrictEqual(events, [])
})

test('filters by key when a keyed notification carries no old value', () => {
  let events: string[] = []
  let $store = map({ a: 1, b: 2 })

  listenKeys($store, ['a'], (value, oldValue, changed) => {
    events.push(`${value.a} ${oldValue?.a} ${changed}`)
  })

  $store.notify(undefined, 'a')
  deepStrictEqual(events, ['1 undefined a'])

  $store.notify(undefined, 'b')
  deepStrictEqual(events, ['1 undefined a'])
})

test('can subscribe to changes and call listener immediately', () => {
  let events: string[] = []
  let $store = map({ a: 1, b: 1 })

  let unbind = subscribeKeys($store, ['a'], value => {
    events.push(`${value.a} ${value.b}`)
  })
  deepStrictEqual(events, ['1 1'])

  $store.setKey('b', 2)
  deepStrictEqual(events, ['1 1'])

  $store.setKey('a', 2)
  deepStrictEqual(events, ['1 1', '2 2'])

  $store.setKey('a', 3)
  deepStrictEqual(events, ['1 1', '2 2', '3 2'])

  $store.setKey('b', 3)
  deepStrictEqual(events, ['1 1', '2 2', '3 2'])

  unbind()
  $store.setKey('a', 4)
  deepStrictEqual(events, ['1 1', '2 2', '3 2'])
})


test('listens for deep keys on whole-store set', () => {
  let events: string[] = []
  let $store = deepMap({ profile: { age: 1, name: 'a' } })

  let unbind = listenKeys($store, ['profile.name'], value => {
    events.push(value.profile.name)
  })

  // a whole-store set that changes the watched path fires
  $store.set({ profile: { age: 1, name: 'b' } })
  deepStrictEqual(events, ['b'])

  // an unrelated sibling under the same parent does not
  $store.set({ profile: { age: 2, name: 'b' } })
  deepStrictEqual(events, ['b'])

  // setting an identical value does not fire either
  $store.set({ profile: { age: 2, name: 'b' } })
  deepStrictEqual(events, ['b'])

  unbind()
  $store.set({ profile: { age: 2, name: 'c' } })
  deepStrictEqual(events, ['b'])
})

test('listens for array paths on whole-store set', () => {
  let events: (number | undefined)[] = []
  let $store = deepMap<{ list: number[] }>({ list: [1, 2] })

  let unbind = listenKeys($store, ['list[1]'], value => {
    events.push(value.list[1])
  })

  $store.set({ list: [1, 3] })
  deepStrictEqual(events, [3])

  $store.set({ list: [9, 3] })
  deepStrictEqual(events, [3])

  unbind()
})

test('keeps plain map keys containing a dot working', () => {
  let events: string[] = []
  let $store = map<{ 'a.b': string }>({ 'a.b': 'one' })

  let unbind = listenKeys($store, ['a.b'], value => {
    events.push(value['a.b'])
  })

  $store.set({ 'a.b': 'two' })
  deepStrictEqual(events, ['two'])

  $store.set({ 'a.b': 'two' })
  deepStrictEqual(events, ['two'])

  unbind()
})
