import { jest } from '@jest/globals'

import { atom } from '../atom/index.js'
import { mount } from './index.js'

jest.useFakeTimers()

describe('mount', () => {
  it('trigered by listen method', () => {
    expect.assertions(1)

    let store = atom(0)

    let events: (string | number)[] = []

    mount(store, () => {
      events.push('mount')
      return () => {
        events.push('unmount')
      }
    })

    let unbind = store.listen(value => {
      events.push(value)
    })

    store.set(1)
    store.set(2)

    unbind()

    store.set(1)

    expect(events).toEqual(['mount', 1, 2, 'unmount'])
  })

  it('trigered by get method', () => {
    expect.assertions(1)

    let store = atom(0)

    let events: (string | number)[] = []

    mount(store, () => {
      events.push('mount')
      return () => {
        events.push('unmount')
      }
    })

    store.get()
    store.get()

    expect(events).toEqual(['mount', 'unmount', 'mount', 'unmount'])
  })

  it('data from constructor', () => {
    expect.assertions(3)

    let store = atom(0)

    let events: (string | number)[] = []

    mount(store, () => {
      events.push('mount')
      store.set(23)
      return () => {
        events.push('unmount')
      }
    })

    expect(store.get()).toBe(23)
    expect(store.get()).toBe(23)

    expect(events).toEqual(['mount', 'unmount', 'mount', 'unmount'])
  })
})
