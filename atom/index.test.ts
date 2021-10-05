import { jest } from '@jest/globals'

import { atom, onMount } from '../index.js'

jest.useFakeTimers()

it('listens', () => {
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

it('subscribes', () => {
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

it('has default value', () => {
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
  expect(events).toEqual([undefined, { test: 2 }, { test: 3 }])
  unsub()
})

it('initializes store when it has listeners', () => {
  let events: string[] = []

  let test = atom<string>()

  onMount(test, () => {
    test.set('initial')
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  expect(events).toEqual([])

  let unbind1 = test.listen(value => {
    events.push(`1: ${value}`)
  })
  expect(events).toEqual(['init'])

  let unbind2 = test.listen(value => {
    events.push(`2: ${value}`)
  })
  expect(events).toEqual(['init'])

  test.set('new')
  expect(events).toEqual(['init', '1: new', '2: new'])

  unbind1()
  jest.runAllTimers()
  expect(events).toEqual(['init', '1: new', '2: new'])

  test.set('new2')
  expect(events).toEqual(['init', '1: new', '2: new', '2: new2'])

  unbind2()
  expect(events).toEqual(['init', '1: new', '2: new', '2: new2'])

  let unbind3 = test.listen(() => {})
  jest.runAllTimers()
  expect(events).toEqual(['init', '1: new', '2: new', '2: new2'])

  unbind3()
  expect(events).toEqual(['init', '1: new', '2: new', '2: new2'])

  jest.runAllTimers()
  expect(events).toEqual(['init', '1: new', '2: new', '2: new2', 'destroy'])
})

it('supports complicated case of last unsubscribing', () => {
  let events: string[] = []

  let test = atom<string>()

  onMount(test, () => {
    return () => {
      events.push('destroy')
    }
  })

  let unbind1 = test.listen(() => {})
  unbind1()

  let unbind2 = test.listen(() => {})
  unbind2()

  jest.runAllTimers()
  expect(events).toEqual(['destroy'])
})

it('supports the same listeners', () => {
  let events: string[] = []
  function listener(value: string): void {
    events.push(value)
  }

  let test = atom<string>()

  onMount(test, () => {
    return () => {
      events.push('destroy')
    }
  })

  let unbind1 = test.listen(listener)
  let unbind2 = test.listen(listener)
  test.set('1')
  expect(events).toEqual(['1', '1'])

  unbind1()
  jest.runAllTimers()
  test.set('2')
  expect(events).toEqual(['1', '1', '2'])

  unbind2()
  jest.runAllTimers()
  expect(events).toEqual(['1', '1', '2', 'destroy'])
})

it('supports double unsubscribe', () => {
  let test = atom<string>('')
  let unbind = test.listen(() => {})
  test.listen(() => {})

  unbind()
  unbind()

  expect(test.lc).toEqual(1)
})

it('can subscribe to changes and call listener immediately', () => {
  let events: string[] = []

  let test = atom<string>()

  onMount(test, () => {
    test.set('initial')
    return () => {
      events.push('destroy')
    }
  })

  let unbind = test.subscribe(value => {
    events.push(value)
  })
  expect(events).toEqual(['initial'])

  test.set('new')
  expect(events).toEqual(['initial', 'new'])

  unbind()
  jest.runAllTimers()
  expect(events).toEqual(['initial', 'new', 'destroy'])
})

it('supports starting store again', () => {
  let events: string[] = []

  let test = atom<string>()

  onMount(test, () => {
    test.set('0')
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  let unbind = test.subscribe(value => {
    events.push(value)
  })

  test.set('1')

  unbind()
  jest.runAllTimers()

  test.set('2')

  test.subscribe(value => {
    events.push(value)
  })
  expect(events).toEqual(['init', '0', '1', 'destroy', 'init', '0'])
})

it('works without initializer', () => {
  let events: (string | undefined)[] = []

  let test = atom<string | undefined>()

  let unbind = test.subscribe(value => {
    events.push(value)
  })
  expect(events).toEqual([undefined])

  test.set('new')
  expect(events).toEqual([undefined, 'new'])

  unbind()
  jest.runAllTimers()
})

it('supports conditional destroy', () => {
  let events: string[] = []

  let destroyable = true
  let test = atom<string>()

  onMount(test, () => {
    events.push('init')
    if (destroyable) {
      return () => {
        events.push('destroy')
      }
    }
  })

  let unbind1 = test.listen(() => {})
  unbind1()
  jest.runAllTimers()
  expect(events).toEqual(['init', 'destroy'])

  destroyable = false
  let unbind2 = test.listen(() => {})
  unbind2()
  jest.runAllTimers()
  expect(events).toEqual(['init', 'destroy', 'init'])
})

it('does not mutate listeners while change event', () => {
  let events: string[] = []
  let test = atom<number>()

  onMount(test, () => {
    test.set(0)
  })

  test.listen(value => {
    events.push(`a${value}`)
    unbindB()
    test.listen(v => {
      events.push(`c${v}`)
    })
  })

  let unbindB = test.listen(value => {
    events.push(`b${value}`)
  })

  test.set(1)
  expect(events).toEqual(['a1', 'b1'])

  test.set(2)
  expect(events).toEqual(['a1', 'b1', 'a2', 'c2'])
})
