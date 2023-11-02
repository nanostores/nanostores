import { test } from 'uvu'
import { equal } from 'uvu/assert'

import { deepMap, listenKeys, map } from '../index.js'

test('listen for specific keys', () => {
  let events: string[] = []
  let $store = map({ a: 1, b: 1 })

  let unbind = listenKeys($store, ['a'], (value, changed) => {
    equal(changed, 'a')
    events.push(`${value.a} ${value.b}`)
  })
  equal(events, [])

  $store.setKey('b', 2)
  equal(events, [])

  $store.setKey('a', 2)
  equal(events, ['2 2'])

  $store.setKey('a', 3)
  equal(events, ['2 2', '3 2'])

  $store.setKey('b', 3)
  equal(events, ['2 2', '3 2'])

  unbind()
  $store.setKey('a', 4)
  equal(events, ['2 2', '3 2'])
})

test('allows setting specific deep keys', () => {
  let events: string[] = []
  let $store = deepMap({ a: { b: { c: { d: [1] } }, e: 1, f: [[{ g: 1 }]] } })

  listenKeys($store, ['a.e'], value => {
    events.push(`e${value.a.e}`)
  })
  listenKeys($store, ['a.b.c.d'], value => {
    events.push(`d${JSON.stringify(value.a.b.c.d)}`)
  })
  listenKeys($store, ['a.b.c.d[1]'], value => {
    events.push(`d[1]${value.a.b.c.d[1]}`)
  })
  listenKeys($store, ['a.f[0][0].g'], value => {
    events.push(`g${value.a.f[0][0].g}`)
  })

  $store.setKey('a.e', 2)
  $store.setKey('a.b.c.d', [2])
  $store.setKey('a.b.c.d[0]', 3)
  $store.setKey('a.b.c.d[1]', 4)
  $store.setKey('a.f[0][1]', {g: 0})
  $store.setKey('a.f[0][0].g', 5)
  equal(events, ['e2', 'd[2]', 'd[1]4', 'g5'])
})

test.run()
