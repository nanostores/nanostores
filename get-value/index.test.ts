import { jest } from '@jest/globals'

import { atom, map, getValue, mount } from '../index.js'

jest.useFakeTimers()

it('reads store value', () => {
  let store = atom<string>()

  mount(store, () => {
    store.set('initial')
  })

  expect(getValue(store)).toEqual('initial')

  let unbind = store.listen(() => {})
  store.set('new')
  expect(getValue(store)).toEqual('new')

  unbind()
  jest.runAllTimers()
  expect(getValue(store)).toEqual('initial')
})

it('reads map store value', () => {
  let store = map<{ a: number }>()

  mount(store, () => {
    store.setKey('a', 0)
  })

  expect(getValue(store)).toEqual({ a: 0 })

  let unbind = store.listen(() => {})
  store.setKey('a', 1)
  expect(getValue(store)).toEqual({ a: 1 })

  unbind()
  jest.runAllTimers()
  expect(getValue(store)).toEqual({ a: 0 })
})
