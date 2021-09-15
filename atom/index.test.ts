import { jest } from '@jest/globals'

import { atom } from './index.js'

jest.useFakeTimers()

describe('atom', () => {
  it('listen', () => {
    expect.assertions(3)
    let store = atom({ some: { path: 0 } })
    let unbind = store.listen(value => {
      expect(value).toBe(store.get())
    })

    store.set({ some: { path: 1 } })
    store.set({ some: { path: 2 } })
    expect(store.get()).toEqual({ some: { path: 2 } })
    unbind()
  })

  it('subscribe', () => {
    expect.assertions(4)
    let store = atom({ some: { path: 0 } })
    let unbind = store.subscribe(value => {
      expect(value).toBe(store.get())
    })

    store.set({ some: { path: 1 } })
    store.set({ some: { path: 2 } })
    expect(store.get()).toEqual({ some: { path: 2 } })
    unbind()
  })

  it('default value', () => {
    let events: any[] = []
    let time = atom()
    time.listen(() => {})
    time.listen(() => {})
    time.listen(() => {})
    let unsub = time.subscribe(value => {
      events.push(value)
    })
    time.set({ test: 2 })
    time.set({ test: 3 })
    expect(events).toEqual([{}, { test: 2 }, { test: 3 }])
    unsub()
  })
})
