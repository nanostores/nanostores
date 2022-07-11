import { equal } from 'uvu/assert'
import { test } from 'uvu'

import { map, listenKeys } from '../index.js'

test('listen for specific keys', () => {
  let events: string[] = []
  let store = map({ a: 1, b: 1 })

  let unbind = listenKeys(store, ['a'], (value, changed) => {
    equal(changed, 'a')
    events.push(`${value.a} ${value.b}`)
  })
  equal(events, [])

  store.setKey('b', 2)
  equal(events, [])

  store.setKey('a', 2)
  equal(events, ['2 2'])

  store.setKey('a', 3)
  equal(events, ['2 2', '3 2'])

  store.setKey('b', 3)
  equal(events, ['2 2', '3 2'])

  unbind()
  store.setKey('a', 4)
  equal(events, ['2 2', '3 2'])
})

test.run()
