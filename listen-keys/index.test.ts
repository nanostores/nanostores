import { deepStrictEqual, equal } from 'node:assert'
import { test } from 'node:test'

import { listenKeys, map, subscribeKeys } from '../index.js'

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
