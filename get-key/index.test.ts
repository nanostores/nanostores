import { equal } from 'node:assert'
import { test } from 'node:test'

import { deepMap } from '../deep-map/index.js'
import { map } from '../map/index.js'
import { getKey } from './index.js'

test('getKey returns correct value for simple keys', () => {
  let $store = map({
    a: 1,
    b: 'test',
    c: true
  })

  equal(getKey($store, 'a'), 1)
  equal(getKey($store, 'b'), 'test')
  equal(getKey($store, 'c'), true)
})

test('getKey returns correct value for nested keys', () => {
  let $store = map({
    site: 'testsite',
    user: {
      name: 'John',
      profile: {
        age: 30,
        email: 'john@example.com'
      }
    }
  })

  equal(getKey($store, 'user.name'), 'John')
  equal(getKey($store, 'user.profile.age'), 30)
  equal(getKey($store, 'user.profile.email'), 'john@example.com')
})

test('getKey returns correct value for array indices', () => {
  let $store = deepMap({
    items: ['apple', 'banana'],
    nested: [
      { id: 1, name: ['Item 1', 'Item 1.1'] },
      { id: 2, name: ['Item 2', 'Item 2.1'] }
    ]
  })

  equal(getKey($store, 'items[0]'), 'apple')
  equal(getKey($store, 'items[1]'), 'banana')
  equal(getKey($store, 'items[2]'), undefined)

  equal(getKey($store, 'nested[0].name[0]'), 'Item 1')
  equal(getKey($store, 'nested[1].id'), 2)
  equal(getKey($store, 'nested[2]'), undefined)
  equal(getKey($store, 'nested[2].id'), undefined)
})
