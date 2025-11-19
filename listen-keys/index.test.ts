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
