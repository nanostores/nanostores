import { map, listenKeys } from '../index.js'

it('listen for specific keys', () => {
  let events: string[] = []
  let store = map({ a: 1, b: 1 })

  let unbind = listenKeys(store, ['a'], (value, changed) => {
    expect(changed).toBe('a')
    events.push(`${value.a} ${value.b}`)
  })
  expect(events).toEqual([])

  store.setKey('b', 2)
  expect(events).toEqual([])

  store.setKey('a', 2)
  expect(events).toEqual(['2 2'])

  store.setKey('a', 3)
  expect(events).toEqual(['2 2', '3 2'])

  store.setKey('b', 3)
  expect(events).toEqual(['2 2', '3 2'])

  unbind()
  store.setKey('a', 4)
  expect(events).toEqual(['2 2', '3 2'])
})
