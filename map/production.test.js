import '../test/set-production.js'

import { batch } from '@spred/core'
import { deepStrictEqual } from 'node:assert'
import { test } from 'node:test'

import { map, onMount } from '../index.js'

test('combines multiple changes for the same store with batch function', () => {
  let changes = []
  let store = map()

  onMount(store, () => {
    store.setKey('a', 1)
    return () => {
      changes.push('destroy')
    }
  })

  let checks = []
  let prev
  let unbind = store.subscribe(value => {
    if (prev) checks.push(value === prev)
    prev = value
    changes.push(value)
  })

  batch(() => {
    store.setKey('a', 2)
    store.set({ a: 3 })
  })

  unbind()

  deepStrictEqual(changes, [{}, { a: 1 }, { a: 3 }, 'destroy'])
  deepStrictEqual(checks, [false, false])
})
