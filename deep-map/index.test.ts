import FakeTimers, { InstalledClock } from '@sinonjs/fake-timers'
import { equal } from 'uvu/assert'
import { test } from 'uvu'

import { deepMap } from './index.js'
import { onMount } from '../lifecycle/index.js'

let clock: InstalledClock

test.before(() => {
  clock = FakeTimers.install()
})

test.after(() => {
  clock.uninstall()
})

test('initializes store when it has listeners', () => {
  let events: string[] = []

  let store = deepMap<{ a: number; b: number }>()

  onMount(store, () => {
    store.setKey('a', 0)
    store.setKey('b', 0)
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  equal(events, [])

  let unbind1 = store.listen((value, key) => {
    events.push(`1: ${key} ${JSON.stringify(value)}`)
  })
  equal(events, ['init'])

  let unbind2 = store.listen((value, key) => {
    events.push(`2: ${key} ${JSON.stringify(value)}`)
  })
  equal(events, ['init'])

  store.setKey('a', 1)
  equal(events, ['init', '1: a {"a":1,"b":0}', '2: a {"a":1,"b":0}'])

  unbind1()
  clock.runAll()
  equal(events, ['init', '1: a {"a":1,"b":0}', '2: a {"a":1,"b":0}'])

  store.setKey('b', 1)
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

  let unbind3 = store.listen(() => {})
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

  let store = deepMap<{}>()

  onMount(store, () => {
    return () => {
      events.push('destroy')
    }
  })

  let unbind1 = store.listen(() => {})
  unbind1()

  let unbind2 = store.listen(() => {})
  unbind2()

  clock.runAll()
  equal(events, ['destroy'])
})

test('supports the same listeners', () => {
  let events: string[] = []
  function listener(value: { a: number }, key: 'a' | undefined): void {
    events.push(`${key}: ${key ? value[key] : undefined}`)
  }

  let store = deepMap<{ a: number }>()

  onMount(store, () => {
    return () => {
      events.push('destroy')
    }
  })

  let unbind1 = store.listen(listener)
  let unbind2 = store.listen(listener)
  store.setKey('a', 1)
  equal(events, ['a: 1', 'a: 1'])

  unbind1()
  clock.runAll()
  store.setKey('a', 2)
  equal(events, ['a: 1', 'a: 1', 'a: 2'])

  unbind2()
  clock.runAll()
  equal(events, ['a: 1', 'a: 1', 'a: 2', 'destroy'])
})

test('can subscribe to changes and call listener immediately', () => {
  let events: string[] = []

  let store = deepMap<{ a: number }>()

  onMount(store, () => {
    store.setKey('a', 0)
    return () => {
      events.push('destroy')
    }
  })

  let unbind = store.subscribe((value, key) => {
    events.push(`${key}: ${JSON.stringify(value)}`)
  })
  equal(events, ['undefined: {"a":0}'])

  store.setKey('a', 1)
  equal(events, ['undefined: {"a":0}', 'a: {"a":1}'])

  unbind()
  clock.runAll()
  equal(events, ['undefined: {"a":0}', 'a: {"a":1}', 'destroy'])
})

test('supports starting store again', () => {
  let events: string[] = []

  let store = deepMap<{ a: number }>()

  onMount(store, () => {
    store.setKey('a', 0)
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  let unbind = store.subscribe(value => {
    events.push(`${value.a}`)
  })

  store.setKey('a', 1)

  unbind()
  clock.runAll()

  store.set({ a: 2 })
  store.setKey('a', 3)

  store.subscribe(value => {
    events.push(`${value.a}`)
  })
  equal(events, ['init', '0', '1', 'destroy', 'init', '0'])
})

test('works without initializer', () => {
  let events: (string | undefined)[] = []

  let store = deepMap<{ a: number }>()

  let unbind = store.subscribe((value, key) => {
    events.push(key)
  })
  equal(events, [undefined])

  store.setKey('a', 1)
  equal(events, [undefined, 'a'])

  unbind()
  clock.runAll()
})

test('supports conditional destroy', () => {
  let events: string[] = []

  let destroyable = true
  let store = deepMap<{ one?: number }>()

  onMount(store, () => {
    events.push('init')
    if (destroyable) {
      return () => {
        events.push('destroy')
      }
    }
  })

  let unbind1 = store.listen(() => {})
  unbind1()
  clock.runAll()
  equal(events, ['init', 'destroy'])

  destroyable = false
  let unbind2 = store.listen(() => {})
  unbind2()
  clock.runAll()
  equal(events, ['init', 'destroy', 'init'])
})

test('changes the whole object', () => {
  let store = deepMap<{ a: number; b: number; c?: number }>()

  onMount(store, () => {
    store.setKey('a', 0)
    store.setKey('b', 0)
  })

  let changes: (string | undefined)[] = []
  store.listen((value, key) => {
    changes.push(key)
  })

  store.set({ a: 1, b: 0, c: 0 })
  equal(store.get(), { a: 1, b: 0, c: 0 })
  equal(changes, [undefined])

  store.set({ a: 1, b: 1 })
  equal(store.get(), { a: 1, b: 1 })
  equal(changes, [undefined, undefined])
})

test('does not call listeners on no changes', () => {
  let store = deepMap<{ one: number }>({ one: 1 })

  let changes: (string | undefined)[] = []
  store.listen((value, key) => {
    changes.push(key)
  })

  store.setKey('one', 1)
  store.set({ one: 1 })
  equal(changes, [undefined])
})

test('changes value object reference', () => {
  let store = deepMap<{ a: number }>({ a: 0 })

  let checks: boolean[] = []
  let prev: { a: number } | undefined
  store.subscribe(value => {
    if (prev) checks.push(value === prev)
    prev = value
  })

  store.setKey('a', 1)
  store.set({ a: 2 })
  equal(checks, [false, false])
})

test('deletes keys on undefined value', () => {
  let store = deepMap<{ a: number | undefined }>()

  let keys: string[][] = []
  store.listen(value => {
    keys.push(Object.keys(value))
  })

  store.setKey('a', 1)
  store.setKey('a', undefined)
  equal(keys, [['a'], []])
})

test('does not mutate listeners while change event', () => {
  let events: string[] = []
  let store = deepMap<{ a: number }>({ a: 0 })

  store.listen(value => {
    events.push(`a${value.a}`)
    unbindB()
    store.listen(v => {
      events.push(`c${v.a}`)
    })
  })

  let unbindB = store.listen(value => {
    events.push(`b${value.a}`)
  })

  store.setKey('a', 1)
  equal(events, ['a1', 'b1'])

  store.setKey('a', 2)
  equal(events, ['a1', 'b1', 'a2', 'c2'])
})

test.run()
