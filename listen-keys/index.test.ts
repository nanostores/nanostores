import { deepStrictEqual } from 'node:assert'
import { test } from 'node:test'

import { batch, deepMap, listenKeyPaths, listenKeys, map, setPath, subscribeKeyPaths, subscribeKeys } from '../index.js'

test('listen for specific keys changed via setKey', () => {
  let events: string[] = []
  let $store = map({ a: 1, b: 1 })

  let unbind = listenKeys($store, ['a'], (value) => {
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

test('listens for specific keys changed via set', () => {
  let events: string[] = []
  let $store = map({ a: 1, b: 1 })

  let unbind = listenKeys($store, ['a'], (value) => {
    events.push(`${value.a} ${value.b}`)
  })
  deepStrictEqual(events, [])

  $store.set({ a: 1, b: 2 })
  deepStrictEqual(events, [])

  $store.set({ a: 2, b: 2 })
  deepStrictEqual(events, ['2 2'])

  $store.set({ a: 3, b: 2 })
  deepStrictEqual(events, ['2 2', '3 2'])

  $store.set({ a: 3, b: 3 })
  deepStrictEqual(events, ['2 2', '3 2'])

  unbind()
  $store.set({ a: 4, b: 3 })
  deepStrictEqual(events, ['2 2', '3 2'])
})

test('allows setting specific deep keys changed via setKey', () => {
  let events: string[] = []
  let $store = deepMap({ a: { b: { c: { d: [1] } }, e: 1, f: [[{ g: 1 }]] } })

  listenKeyPaths($store, ['a.e'], value => {
    events.push(`e${value.a.e}`)
  })
  listenKeyPaths($store, ['a.b.c.d'], value => {
    events.push(`d${JSON.stringify(value.a.b.c.d)}`)
  })
  listenKeyPaths($store, ['a.b.c.d[1]'], value => {
    events.push(`d[1]${value.a.b.c.d[1]}`)
  })
  listenKeyPaths($store, ['a.f[0][0].g'], value => {
    events.push(`g${value.a.f[0][0].g}`)
  })

  $store.setKey('a.e', 2)
  $store.setKey('a.b.c.d', [2])
  $store.setKey('a.b.c.d[0]', 3)
  $store.setKey('a.b.c.d[1]', 4)
  $store.setKey('a.f[0][1]', { g: 0 })
  $store.setKey('a.f[0][0].g', 5)
  deepStrictEqual(events, ['e2', 'd[2]', 'd[3]', 'd[3,4]', 'd[1]4', 'g5'])
})

test('allows setting specific deep keys changed via set', () => {
  let events: string[] = []
  let $store = deepMap({ a: { b: { c: { d: [1] } }, e: 1, f: [[{ g: 1 }]] } })

  listenKeyPaths($store, ['a.e'], value => {
    events.push(`e${value.a.e}`)
  })
  listenKeyPaths($store, ['a.b.c.d'], value => {
    events.push(`d${JSON.stringify(value.a.b.c.d)}`)
  })
  listenKeyPaths($store, ['a.b.c.d[1]'], value => {
    events.push(`d[1]${value.a.b.c.d[1]}`)
  })
  listenKeyPaths($store, ['a.f[0][0].g'], value => {
    events.push(`g${value.a.f[0][0].g}`)
  })

  $store.set(setPath($store.value!, 'a.e', 2))
  $store.set(setPath($store.value!, 'a.b.c.d', [2]))
  $store.set(setPath($store.value!, 'a.b.c.d[0]', 3))
  $store.set(setPath($store.value!, 'a.b.c.d[1]', 4))
  $store.set(setPath($store.value!, 'a.f[0][1]', { g: 0 }))
  $store.set(setPath($store.value!, 'a.f[0][0].g', 5))
  deepStrictEqual(events, ['e2', 'd[2]', 'd[3]', 'd[3,4]', 'd[1]4', 'g5'])
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

test('subscribeKeyPaths', () => {
  let events: string[] = []
  let $store = deepMap({ a: { b: 1 } })

  subscribeKeyPaths($store, ['a.b'], value => {
    events.push(`b${value.a.b}`)
  })

  $store.set({ a: { b: 2 } })
  deepStrictEqual(events, ['b1', 'b2'])
})

test('store is changed multiple times in a batch', () => {
  let events: string[] = []
  let $store = map({ a: 1, b: 1 })

  let unbind = listenKeys($store, ['a'], (value) => {
    events.push(`${value.a} ${value.b}`)
  })
  deepStrictEqual(events, [])

  batch(() => {
    $store.setKey('b', 2)
    $store.setKey('a', 2)
    $store.setKey('a', 3)
    $store.setKey('b', 3)
  })

  deepStrictEqual(events, ['3 3'])
  unbind()
})
