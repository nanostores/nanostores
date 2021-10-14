import { jest } from '@jest/globals'

import '../test/set-production.js'
import { map, onMount } from '../index.js'

jest.useFakeTimers()

it('combines multiple changes for the same store', () => {
  let changes = []
  let test = map()

  onMount(test, () => {
    test.setKey('a', 1)
    return () => {
      changes.push('destroy')
    }
  })

  let checks = []
  let prev
  let unbind = test.subscribe((value, key) => {
    if (prev) checks.push(value === prev)
    prev = value
    changes.push(key)
  })

  test.setKey('a', 2)
  test.set({ a: 3 })
  test.notify('a')

  unbind()
  jest.runAllTimers()

  expect(changes).toEqual([undefined, 'a', 'a', 'a', 'destroy'])
  expect(checks).toEqual([false, false, true])
})
