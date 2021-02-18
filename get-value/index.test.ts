import { delay } from 'nanodelay'

import { createStore, createMap, getValue } from '../index.js'

it('reads store value', async () => {
  let store = createStore<string>(() => {
    store.set('initial')
  })
  expect(getValue(store)).toEqual('initial')

  let unbind = store.listen(() => {})
  store.set('new')
  expect(getValue(store)).toEqual('new')

  unbind()
  await delay(1)
  expect(getValue(store)).toEqual('initial')
})

it('reads map store value', async () => {
  let store = createMap<{ a: number }>(() => {
    store.setKey('a', 0)
  })
  expect(getValue(store)).toEqual({ a: 0 })

  let unbind = store.listen(() => {})
  store.setKey('a', 1)
  expect(getValue(store)).toEqual({ a: 1 })

  unbind()
  await delay(1)
  expect(getValue(store)).toEqual({ a: 0 })
})
