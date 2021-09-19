import { delay } from 'nanodelay'

import { atom } from '../atom/index.js'
import { mount, STORE_CLEAN_DELAY } from './index.js'

describe('mount', () => {
  it('trigered by listen method', async () => {
    expect.assertions(1)

    let store = atom(0)

    let events: (string | number)[] = []

    let unmountEnhancer = mount(store, () => {
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

    await delay(STORE_CLEAN_DELAY)
    expect(events).toEqual(['mount', 1, 2, 'unmount'])
    unmountEnhancer()
  })

  it('trigered by get method', async () => {
    expect.assertions(1)

    let store = atom(0)

    let events: (string | number)[] = []

    let unmountEnhancer = mount(store, () => {
      events.push('mount')
      return () => {
        events.push('unmount')
      }
    })

    store.get()
    store.get()

    await delay(STORE_CLEAN_DELAY)
    expect(events).toEqual(['mount', 'unmount'])
    unmountEnhancer()
  })

  it('data from constructor', async () => {
    expect.assertions(3)

    let store = atom(0)

    let events: (string | number)[] = []

    let unmountEnhancer = mount(store, () => {
      events.push('mount')
      store.set(23)
      return () => {
        events.push('unmount')
      }
    })

    expect(store.get()).toBe(23)
    expect(store.get()).toBe(23)

    await delay(STORE_CLEAN_DELAY)

    expect(events).toEqual(['mount', 'unmount'])
    unmountEnhancer()
  })
})
