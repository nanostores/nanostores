import { TestClient } from '@logux/client'

import {
  prepareForTest,
  emptyInTest,
  cleanStores,
  defineMap,
  getValue
} from '../index.js'
import { defineSyncMap, createFilter } from '../sync/index.js'

let client = new TestClient('10')
let User = defineSyncMap<{ name: string }>('users')

afterEach(() => {
  cleanStores(User)
})

it('prepares instances', () => {
  let user1a = prepareForTest(client, User, { id: '1', name: 'Test user' })
  let user1b = User('1', client)

  expect(user1a).toBe(user1b)
  expect(getValue(user1b)).toEqual({
    id: '1',
    name: 'Test user',
    isLoading: false
  })

  let user2 = User('2', client)
  expect(getValue(user2)).toEqual({
    id: '2',
    isLoading: true
  })
})

it('generates IDs', () => {
  let user1 = prepareForTest(client, User, { name: 'Test 1' })
  let user2 = prepareForTest(client, User, { name: 'Test 2' })

  expect(getValue(user1).id).toEqual('users:1')
  expect(getValue(user2).id).toEqual('users:2')
})

it('works with maps', () => {
  let Store = defineMap<{ id: string; name: string; role?: string }>(store => {
    store.setKey('role', 'default')
  })

  let store1 = prepareForTest(client, Store, { name: 'Test 1' })
  let store2 = prepareForTest(client, Store, { name: 'Test 2' })

  expect(getValue(store1).id).toHaveLength(6)
  expect(getValue(store1).id).not.toEqual(getValue(store2).id)
  expect(getValue(store1)).toEqual({
    id: getValue(store1).id,
    name: 'Test 1',
    role: 'default'
  })
})

it('works with filters', () => {
  prepareForTest(client, User, { name: 'Test 1' })
  prepareForTest(client, User, { name: 'Test 2' })

  let users1 = createFilter(client, User)
  users1.listen(() => {})

  expect(getValue(users1).isLoading).toBe(false)
  expect(getValue(users1).list).toEqual([
    { id: 'users:1', isLoading: false, name: 'Test 1' },
    { id: 'users:2', isLoading: false, name: 'Test 2' }
  ])

  cleanStores(User)
  let users2 = createFilter(client, User)
  expect(getValue(users2).isLoading).toBe(true)
})

it('marks empty', () => {
  emptyInTest(User)

  let users1 = createFilter(client, User)
  users1.listen(() => {})

  expect(getValue(users1).isLoading).toBe(false)
  expect(getValue(users1).list).toEqual([])
})
