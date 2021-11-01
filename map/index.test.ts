import FakeTimers from '@sinonjs/fake-timers'
import { equal } from 'uvu/assert'
import { test } from 'uvu'

import { map, onMount } from '../index.js'

let clock = FakeTimers.install()

test('initializes store when it has listeners', () => {
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

  equal(events, [])

  let unbind1 = test.listen((value, key) => {
    events.push(`1: ${key} ${JSON.stringify(value)}`)
  })
  equal(events, ['init'])

  let unbind2 = test.listen((value, key) => {
    events.push(`2: ${key} ${JSON.stringify(value)}`)
  })
  equal(events, ['init'])

  test.setKey('a', 1)
  equal(events, ['init', '1: a {"a":1,"b":0}', '2: a {"a":1,"b":0}'])

  unbind1()
  clock.runAll()
  equal(events, ['init', '1: a {"a":1,"b":0}', '2: a {"a":1,"b":0}'])

  test.setKey('b', 1)
  equal(events, [
    'init',
    '1: a {"a":1,"b":0}',
    '2: a {"a":1,"b":0}',
    '2: b {"a":1,"b":1}'
  ])

  unbind2()
  equal(events, [
    'init',
    '1: a {"a":1,"b":0}',
    '2: a {"a":1,"b":0}',
    '2: b {"a":1,"b":1}'
  ])

  let unbind3 = test.listen(() => {})
  clock.runAll()
  equal(events, [
    'init',
    '1: a {"a":1,"b":0}',
    '2: a {"a":1,"b":0}',
    '2: b {"a":1,"b":1}'
  ])

  unbind3()
  equal(events, [
    'init',
    '1: a {"a":1,"b":0}',
    '2: a {"a":1,"b":0}',
    '2: b {"a":1,"b":1}'
  ])

  clock.runAll()
  equal(events, [
    'init',
    '1: a {"a":1,"b":0}',
    '2: a {"a":1,"b":0}',
    '2: b {"a":1,"b":1}',
    'destroy'
  ])
})

test('supports complicated case of last unsubscribing', () => {
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

  clock.runAll()
  equal(events, ['destroy'])
})

test('supports the same listeners', () => {
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
  equal(events, ['a: 1', 'a: 1'])

  unbind1()
  clock.runAll()
  test.setKey('a', 2)
  equal(events, ['a: 1', 'a: 1', 'a: 2'])

  unbind2()
  clock.runAll()
  equal(events, ['a: 1', 'a: 1', 'a: 2', 'destroy'])
})

test('can subscribe to changes and call listener immediately', () => {
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
  equal(events, ['undefined: {"a":0}'])

  test.setKey('a', 1)
  equal(events, ['undefined: {"a":0}', 'a: {"a":1}'])

  unbind()
  clock.runAll()
  equal(events, ['undefined: {"a":0}', 'a: {"a":1}', 'destroy'])
})

test('supports starting store again', () => {
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
  clock.runAll()

  test.set({ a: 2 })
  test.setKey('a', 3)

  test.subscribe(value => {
    events.push(`${value.a}`)
  })
  equal(events, ['init', '0', '1', 'destroy', 'init', '0'])
})

test('works without initializer', () => {
  let events: (string | undefined)[] = []

  let test = map<{ a: number }>()

  let unbind = test.subscribe((value, key) => {
    events.push(key)
  })
  equal(events, [undefined])

  test.setKey('a', 1)
  equal(events, [undefined, 'a'])

  unbind()
  clock.runAll()
})

test('supports conditional destroy', () => {
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
  clock.runAll()
  equal(events, ['init', 'destroy'])

  destroyable = false
  let unbind2 = test.listen(() => {})
  unbind2()
  clock.runAll()
  equal(events, ['init', 'destroy', 'init'])
})

test('changes the whole object', () => {
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
  equal(test.get(), { a: 1, b: 0, c: 0 })
  equal(changes, [undefined])

  test.set({ a: 1, b: 1 })
  equal(test.get(), { a: 1, b: 1 })
  equal(changes, [undefined, undefined])
})

test('does not call listeners on no changes', () => {
  let test = map<{ one: number }>({ one: 1 })

  let changes: string[] = []
  test.listen((value, key) => {
    changes.push(key)
  })

  test.setKey('one', 1)
  test.set({ one: 1 })
  equal(changes, [undefined])
})

test('changes value object reference', () => {
  let test = map<{ a: number }>({ a: 0 })

  let checks: boolean[] = []
  let prev: { a: number } | undefined
  test.subscribe(value => {
    if (prev) checks.push(value === prev)
    prev = value
  })

  test.setKey('a', 1)
  test.set({ a: 2 })
  equal(checks, [false, false])
})

test('deletes keys on undefined value', () => {
  let test = map<{ a: number | undefined }>()

  let keys: string[][] = []
  test.listen(value => {
    keys.push(Object.keys(value))
  })

  test.setKey('a', 1)
  test.setKey('a', undefined)
  equal(keys, [['a'], []])
})

test('does not mutate listeners while change event', () => {
  let events: string[] = []
  let test = map<{ a: number }>({ a: 0 })

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
  equal(events, ['a1', 'b1'])

  test.setKey('a', 2)
  equal(events, ['a1', 'b1', 'a2', 'c2'])
})

test.run()
