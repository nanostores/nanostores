import { deepStrictEqual, equal } from 'node:assert'
import { test } from 'node:test'

import { deepMap, getKey, map, onMount, onNotify } from '../index.js'

test('initializes store when it has listeners', () => {
  let events: string[] = []

  let $store = deepMap<{ a: number; b: number }>()

  onMount($store, () => {
    $store.setKey('a', 0)
    $store.setKey('b', 0)
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  equal(events.length, 0)

  let unbind1 = $store.listen(value => {
    events.push(`1: ${JSON.stringify(value)}`)
  })
  deepStrictEqual(events, ['init', '1: {"a":0,"b":0}'])

  let unbind2 = $store.listen(value => {
    events.push(`2: ${JSON.stringify(value)}`)
  })
  deepStrictEqual(events, ['init', '1: {"a":0,"b":0}'])

  $store.setKey('a', 1)
  deepStrictEqual(events, [
    'init',
    '1: {"a":0,"b":0}',
    '1: {"a":1,"b":0}',
    '2: {"a":1,"b":0}'
  ])

  unbind1()
  deepStrictEqual(events, [
    'init',
    '1: {"a":0,"b":0}',
    '1: {"a":1,"b":0}',
    '2: {"a":1,"b":0}'
  ])

  $store.setKey('b', 1)
  deepStrictEqual(events, [
    'init',
    '1: {"a":0,"b":0}',
    '1: {"a":1,"b":0}',
    '2: {"a":1,"b":0}',
    '2: {"a":1,"b":1}'
  ])

  unbind2()
  deepStrictEqual(events, [
    'init',
    '1: {"a":0,"b":0}',
    '1: {"a":1,"b":0}',
    '2: {"a":1,"b":0}',
    '2: {"a":1,"b":1}',
    'destroy'
  ])

  let unbind3 = $store.listen(() => {})
  deepStrictEqual(events, [
    'init',
    '1: {"a":0,"b":0}',
    '1: {"a":1,"b":0}',
    '2: {"a":1,"b":0}',
    '2: {"a":1,"b":1}',
    'destroy',
    'init'
  ])

  unbind3()
  deepStrictEqual(events, [
    'init',
    '1: {"a":0,"b":0}',
    '1: {"a":1,"b":0}',
    '2: {"a":1,"b":0}',
    '2: {"a":1,"b":1}',
    'destroy',
    'init',
    'destroy'
  ])
})

// test('supports complicated case of last unsubscribing', () => {
//   let events: string[] = []

//   let $store = deepMap()

//   onMount($store, () => {
//     return () => {
//       events.push('destroy')
//     }
//   })

//   let unbind1 = $store.listen(() => {})
//   unbind1()

//   let unbind2 = $store.listen(() => {})
//   unbind2()

//   clock.runAll()
//   deepStrictEqual(events, ['destroy'])
// })

test('supports the same listeners', () => {
  let events: string[] = []
  function listener(value: { a: number }): void {
    events.push(`${value.a}`)
  }

  let $store = deepMap<{ a: number }>()

  onMount($store, () => {
    return () => {
      events.push('destroy')
    }
  })

  let unbind1 = $store.listen(listener)
  let unbind2 = $store.listen(listener)
  $store.setKey('a', 1)
  deepStrictEqual(events, ['1', '1'])

  unbind1()
  $store.setKey('a', 2)
  deepStrictEqual(events, ['1', '1', '2'])

  unbind2()
  deepStrictEqual(events, ['1', '1', '2', 'destroy'])
})

test('can subscribe to changes and call listener immediately', () => {
  let events: string[] = []

  let $store = deepMap<{ a: number }>()

  onMount($store, () => {
    $store.setKey('a', 0)
    return () => {
      events.push('destroy')
    }
  })

  let unbind = $store.subscribe(value => {
    events.push(JSON.stringify(value))
  })
  deepStrictEqual(events, ['{}', '{"a":0}'])

  $store.setKey('a', 1)
  deepStrictEqual(events, ['{}', '{"a":0}', '{"a":1}'])

  unbind()
  deepStrictEqual(events, ['{}', '{"a":0}', '{"a":1}', 'destroy'])
})

test('supports starting store again', () => {
  let events: string[] = []

  let $store = deepMap<{ a: number }>()

  onMount($store, () => {
    $store.setKey('a', 0)
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  let unbind = $store.subscribe(value => {
    events.push(`${value.a}`)
  })

  $store.setKey('a', 1)

  unbind()

  $store.set({ a: 2 })
  $store.setKey('a', 3)

  $store.subscribe(value => {
    events.push(`${value.a}`)
  })
  deepStrictEqual(events, [
    'init',
    'undefined',
    '0',
    '1',
    'destroy',
    'init',
    '3',
    '0'
  ])
})

test('works without initializer', () => {
  let events: ({ a: number } | undefined)[] = []

  let $store = deepMap<{ a: number }>()

  let unbind = $store.subscribe(value => {
    events.push(value)
  })
  deepStrictEqual(events, [{}])

  $store.setKey('a', 1)
  deepStrictEqual(events, [{}, { a: 1 }])

  unbind()
})

test('supports conditional destroy', () => {
  let events: string[] = []

  let destroyable = true
  let $store = deepMap<{ one?: number }>()

  onMount($store, () => {
    events.push('init')
    if (destroyable) {
      return () => {
        events.push('destroy')
      }
    }
  })

  let unbind1 = $store.listen(() => {})
  unbind1()
  deepStrictEqual(events, ['init', 'destroy'])

  destroyable = false
  let unbind2 = $store.listen(() => {})
  unbind2()
  deepStrictEqual(events, ['init', 'destroy', 'init'])
})

test('changes the whole object', () => {
  let $store = deepMap<{ a: number; b: number; c?: number }>()

  onMount($store, () => {
    $store.setKey('a', 0)
    $store.setKey('b', 0)
  })

  $store.listen(() => {})

  $store.set({ a: 1, b: 0, c: 0 })
  deepStrictEqual($store.get(), { a: 1, b: 0, c: 0 })

  $store.set({ a: 1, b: 1 })
  deepStrictEqual($store.get(), { a: 1, b: 1 })
})

test('does not call listeners on no changes', () => {
  let $store = deepMap<{ one: number }>({ one: 1 })

  let changes: ({ one: number } | undefined)[] = []
  $store.listen(value => {
    changes.push(value)
  })

  $store.setKey('one', 1)
  $store.set({ one: 1 })
  deepStrictEqual(changes, [{ one: 1 }])
})

test('changes value object reference', () => {
  let $store = deepMap<{ a: number }>({ a: 0 })

  let checks: boolean[] = []
  let prev: { a: number } | undefined
  $store.subscribe(value => {
    if (prev) checks.push(value === prev)
    prev = value
  })

  $store.setKey('a', 1)
  $store.set({ a: 2 })
  deepStrictEqual(checks, [false, false])
})

test('deletes keys on undefined value', () => {
  let $store = deepMap<{ a: number | undefined }>()

  let keys: string[][] = []
  $store.listen(value => {
    keys.push(Object.keys(value))
  })

  $store.setKey('a', 1)
  $store.setKey('a', undefined)
  deepStrictEqual(keys, [['a'], []])
})

test('does not run queued listeners after they are unsubscribed', () => {
  let events: string[] = []
  let $store = deepMap<{ a: number }>({ a: 0 })

  $store.listen(value => {
    events.push(`a${value.a}`)
    $store.listen(v => {
      events.push(`c${v.a}`)
    })
    if (value.a > 1) {
      unbindB()
    }
  })

  let unbindB = $store.listen(value => {
    events.push(`b${value.a}`)
  })

  $store.setKey('a', 1)
  deepStrictEqual(events, ['a1', 'b1'])

  $store.setKey('a', 2)
  deepStrictEqual(events, ['a1', 'b1', 'a2', 'c2'])
})

test('notifies correct previous value from deep store', () => {
  type DeepValue = { a: number; b: { nested: { deep: number } } }

  let events: DeepValue[] = []
  let $store = deepMap<DeepValue>({
    a: 0,
    b: { nested: { deep: 0 } }
  })

  let unbind = onNotify($store, ({ oldValue }) => {
    events.push(oldValue)
  })

  $store.setKey('a', 1)
  $store.setKey('b.nested.deep', 1)
  $store.setKey('b.nested.deep', 2)
  deepStrictEqual(events, [
    { a: 0, b: { nested: { deep: 0 } } },
    { a: 1, b: { nested: { deep: 0 } } },
    { a: 1, b: { nested: { deep: 1 } } }
  ])
  unbind()
})

// test('passes previous value to listeners', () => {
//   let events: { a: number }[] = []
//   let $store = deepMap<{ a: number }>({ a: 0 })
//   let unbind = $store.listen((value, oldValue) => {
//     events.push(oldValue)
//   })

//   $store.setKey('a', 1)
//   $store.setKey('a', 2)
//   deepStrictEqual(events, [{ a: 0 }, { a: 1 }])
//   unbind()
// })

// test('passes previous value to subscribers', () => {
//   let events: ({ a: number } | undefined)[] = []
//   let $store = deepMap<{ a: number }>({ a: 0 })
//   let unbind = $store.subscribe((value, oldValue) => {
//     events.push(oldValue)
//   })

//   $store.setKey('a', 1)
//   $store.setKey('a', 2)
//   deepStrictEqual(events, [undefined, { a: 0 }, { a: 1 }])
//   unbind()
// })

// test('oldValue references the same object as the previous value', () => {
//   let events: ({ a: number } | undefined)[] = []
//   let $store = deepMap({ a: 0 })
//   let unbind = $store.subscribe((value, oldValue) => {
//     events.push(oldValue)
//   })

//   let oldValue1 = $store.value
//   $store.setKey('a', 1)
//   let oldValue2 = $store.value
//   $store.setKey('a', 2)

//   // Intentionally not using deepStrictEqual here - we're testing object reference equality
//   equal(events.length, 3)
//   equal(events[0], undefined)
//   equal(events[1], oldValue1)
//   equal(events[2], oldValue2)
//   unbind()
// })

test('keys starting with numbers do not create unnecessary arrays', () => {
  let $store = deepMap<{ key?: { '100key': string } }>({})

  $store.setKey('key.100key', 'value')
  deepStrictEqual($store.get(), { key: { '100key': 'value' } })
})

test('getKey returns correct value for simple keys', () => {
  let $store = map({
    a: 1,
    b: 'test',
    c: true
  })

  equal(getKey($store, 'a'), 1)
  equal(getKey($store, 'b'), 'test')
  equal(getKey($store, 'c'), true)
})

test('getKey returns correct value for nested keys', () => {
  let $store = map({
    site: 'testsite',
    user: {
      name: 'John',
      profile: {
        age: 30,
        email: 'john@example.com'
      }
    }
  })

  equal(getKey($store, 'user.name'), 'John')
  equal(getKey($store, 'user.profile.age'), 30)
  equal(getKey($store, 'user.profile.email'), 'john@example.com')
})

test('getKey returns correct value for array indices', () => {
  let $store = deepMap({
    items: ['apple', 'banana'],
    nested: [
      { id: 1, name: ['Item 1', 'Item 1.1'] },
      { id: 2, name: ['Item 2', 'Item 2.1'] }
    ]
  })

  equal(getKey($store, 'items[0]'), 'apple')
  equal(getKey($store, 'items[1]'), 'banana')
  equal(getKey($store, 'items[2]'), undefined)

  equal(getKey($store, 'nested[0].name[0]'), 'Item 1')
  equal(getKey($store, 'nested[1].id'), 2)
  equal(getKey($store, 'nested[2]'), undefined)
  equal(getKey($store, 'nested[2].id'), undefined)
})
