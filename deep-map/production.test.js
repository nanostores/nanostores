import '../test/set-production.js'

import FakeTimers from '@sinonjs/fake-timers'
import { deepStrictEqual } from 'node:assert'
import { after, test } from 'node:test'

import { deepMap, onMount } from '../index.js'

let clock = FakeTimers.install()

after(() => {
  clock.uninstall()
})

test('combines multiple changes for the same store', () => {
  let changes = []
  let store = deepMap()

  onMount(store, () => {
    store.setKey('a', 1)
    return () => {
      changes.push('destroy')
    }
  })

  let checks = []
  let prev
  let unbind = store.subscribe((value, key) => {
    if (prev) checks.push(value === prev)
    prev = value
    changes.push(key)
  })

  store.setKey('a', 2)
  store.set({ a: 3 })

  unbind()
  clock.runAll()

  deepStrictEqual(changes, [undefined, 'a', undefined, 'destroy'])
  deepStrictEqual(checks, [false, false])
})
