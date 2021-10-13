import { jest } from '@jest/globals'

import { map, onMount } from '../index.js'

jest.useFakeTimers()

it('initializes store when it has listeners', () => {
  let events: string[] = []

  let test = map<{ a: number; b: number }>()

  onMount(test, () => {
    test.setKey('a', 0)
    test.setKey('b', 0)
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  expect(events).toEqual([])

  let unbind1 = test.listen((value, key) => {
    events.push(`1: ${key} ${JSON.stringify(value)}`)
  })
  expect(events).toEqual(['init'])

  let unbind2 = test.listen((value, key) => {
    events.push(`2: ${key} ${JSON.stringify(value)}`)
  })
  expect(events).toEqual(['init'])

  test.setKey('a', 1)
  expect(events).toEqual(['init', '1: a {"a":1,"b":0}', '2: a {"a":1,"b":0}'])

  unbind1()
  jest.runAllTimers()
  expect(events).toEqual(['init', '1: a {"a":1,"b":0}', '2: a {"a":1,"b":0}'])

  test.setKey('b', 1)
  expect(events).toEqual([
    'init',
    '1: a {"a":1,"b":0}',
    '2: a {"a":1,"b":0}',
    '2: b {"a":1,"b":1}'
  ])

  unbind2()
  expect(events).toEqual([
    'init',
    '1: a {"a":1,"b":0}',
    '2: a {"a":1,"b":0}',
    '2: b {"a":1,"b":1}'
  ])

  let unbind3 = test.listen(() => {})
  jest.runAllTimers()
  expect(events).toEqual([
    'init',
    '1: a {"a":1,"b":0}',
    '2: a {"a":1,"b":0}',
    '2: b {"a":1,"b":1}'
  ])

  unbind3()
  expect(events).toEqual([
    'init',
    '1: a {"a":1,"b":0}',
    '2: a {"a":1,"b":0}',
    '2: b {"a":1,"b":1}'
  ])

  jest.runAllTimers()
  expect(events).toEqual([
    'init',
    '1: a {"a":1,"b":0}',
    '2: a {"a":1,"b":0}',
    '2: b {"a":1,"b":1}',
    'destroy'
  ])
})

it('supports complicated case of last unsubscribing', () => {
  let events: string[] = []

  let test = map<{}>()

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
  function listener(value: { a: number }, key: 'a'): void {
    events.push(`${key}: ${value[key]}`)
  }

  let test = map<{ a: number }>()

  onMount(test, () => {
    return () => {
      events.push('destroy')
    }
  })

  let unbind1 = test.listen(listener)
  let unbind2 = test.listen(listener)
  test.setKey('a', 1)
  expect(events).toEqual(['a: 1', 'a: 1'])

  unbind1()
  jest.runAllTimers()
  test.setKey('a', 2)
  expect(events).toEqual(['a: 1', 'a: 1', 'a: 2'])

  unbind2()
  jest.runAllTimers()
  expect(events).toEqual(['a: 1', 'a: 1', 'a: 2', 'destroy'])
})

it('can subscribe to changes and call listener immediately', () => {
  let events: string[] = []

  let test = map<{ a: number }>()

  onMount(test, () => {
    test.setKey('a', 0)
    return () => {
      events.push('destroy')
    }
  })

  let unbind = test.subscribe((value, key) => {
    events.push(`${key}: ${JSON.stringify(value)}`)
  })
  expect(events).toEqual(['undefined: {"a":0}'])

  test.setKey('a', 1)
  expect(events).toEqual(['undefined: {"a":0}', 'a: {"a":1}'])

  unbind()
  jest.runAllTimers()
  expect(events).toEqual(['undefined: {"a":0}', 'a: {"a":1}', 'destroy'])
})

it('supports starting store again', () => {
  let events: string[] = []

  let test = map<{ a: number }>()

  onMount(test, () => {
    test.setKey('a', 0)
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  let unbind = test.subscribe(value => {
    events.push(`${value.a}`)
  })

  test.setKey('a', 1)

  unbind()
  jest.runAllTimers()

  test.set({ a: 2 })
  test.setKey('a', 3)

  test.subscribe(value => {
    events.push(`${value.a}`)
  })
  expect(events).toEqual(['init', '0', '1', 'destroy', 'init', '0'])
})

it('works without initializer', () => {
  let events: (string | undefined)[] = []

  let test = map<{ a: number }>()

  let unbind = test.subscribe((value, key) => {
    events.push(key)
  })
  expect(events).toEqual([undefined])

  test.setKey('a', 1)
  expect(events).toEqual([undefined, 'a'])

  unbind()
  jest.runAllTimers()
})

it('supports conditional destroy', () => {
  let events: string[] = []

  let destroyable = true
  let test = map<{ one?: number }>()

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

it('changes the whole object', () => {
  let test = map<{ a: number; b: number; c?: number }>()

  onMount(test, () => {
    test.setKey('a', 0)
    test.setKey('b', 0)
  })

  let changes: string[] = []
  test.listen((value, key) => {
    changes.push(key)
  })

  test.set({ a: 1, b: 0, c: 0 })
  expect(test.get()).toEqual({ a: 1, b: 0, c: 0 })
  expect(changes).toEqual(['a', 'c'])

  test.set({ a: 1, b: 1 })
  expect(test.get()).toEqual({ a: 1, b: 1 })
  expect(changes).toEqual(['a', 'c', 'b', 'c'])
})

it('does not call listeners on no changes', () => {
  let test = map<{ one: number }>()

  onMount(test, () => {
    test.setKey('one', 1)
  })

  let changes: string[] = []
  test.listen((value, key) => {
    changes.push(key)
  })

  test.setKey('one', 1)
  test.set({ one: 1 })
  expect(changes).toHaveLength(0)
})

it('change value object reference', () => {
  let test = map<{ a: number }>()

  onMount(test, () => {
    test.setKey('a', 0)
  })

  let checks: boolean[] = []
  let prev: { a: number } | undefined
  test.subscribe(value => {
    if (prev) checks.push(value === prev)
    prev = value
  })

  test.setKey('a', 1)
  test.set({ a: 2 })
  expect(checks).toEqual([false, false])
})

it('calls listeners without value changes', () => {
  let test = map<{ one: number }>()

  onMount(test, () => {
    test.setKey('one', 1)
  })

  let changes: string[] = []
  test.listen((value, key) => {
    changes.push(key)
  })

  test.notify('one')
  expect(changes).toEqual(['one'])
})

it('deletes keys on undefined value', () => {
  let test = map<{ a: number | undefined }>()

  let keys: string[][] = []
  test.listen(value => {
    keys.push(Object.keys(value))
  })

  test.setKey('a', 1)
  test.setKey('a', undefined)
  expect(keys).toEqual([['a'], []])
})

it('does not mutate listeners while change event', () => {
  let events: string[] = []
  let test = map<{ a: number }>()

  onMount(test, () => {
    test.setKey('a', 0)
  })

  test.listen(value => {
    events.push(`a${value.a}`)
    unbindB()
    test.listen(v => {
      events.push(`c${v.a}`)
    })
  })

  let unbindB = test.listen(value => {
    events.push(`b${value.a}`)
  })

  test.setKey('a', 1)
  expect(events).toEqual(['a1', 'b1'])

  test.setKey('a', 2)
  expect(events).toEqual(['a1', 'b1', 'a2', 'c2'])
})
