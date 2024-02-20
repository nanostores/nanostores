import { deepStrictEqual, equal, notEqual } from 'node:assert'
import { test } from 'node:test'

import { cleanStores, mapCreator } from '../index.js'

test('creates map store with argument', () => {
  let events = ''
  let User = mapCreator<{ name: string }, [string]>(
    (store, id, defaultName) => {
      events += `init-${id} `
      store.setKey('name', defaultName)
      return () => {
        events += `destroy-${id} `
      }
    }
  )

  let user1 = User('1', 'John')
  let user2 = User('1', 'Bob')
  let user3 = User('2', 'John')

  equal(user1, user2)
  notEqual(user1, user3)

  equal(events, '')
  user1.listen(() => {})
  user2.listen(() => {})
  user3.listen(() => {})

  deepStrictEqual(user1.get(), { id: '1', name: 'John' })

  equal(events, 'init-1 init-2 ')

  cleanStores(user1)
  equal(events, 'init-1 init-2 destroy-1 ')

  let user4 = User('1', 'John')
  user4.listen(() => {})
  equal(events, 'init-1 init-2 destroy-1 init-1 ')

  cleanStores(User)
  equal(events, 'init-1 init-2 destroy-1 init-1 destroy-1 destroy-2 ')
})

test('creates map store with ID only', () => {
  let events = ''
  let User = mapCreator<{ name: string }>((store, id) => {
    events += `init-${id} `
    store.setKey('name', 'default')
    return () => {
      events += `destroy-${id} `
    }
  })

  let user1 = User('1')
  user1.listen(() => {})
  deepStrictEqual(user1.get(), { id: '1', name: 'default' })

  cleanStores(User)
  equal(events, 'init-1 destroy-1 ')
})
