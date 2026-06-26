import FakeTimers from '@sinonjs/fake-timers'
import { deepStrictEqual, equal } from 'node:assert'
import { test } from 'node:test'

import {
  atom,
  batch,
  computed,
  effect,
  listenKeys,
  map,
  onMount,
  readonlyType
} from '../index.js'

let clock = FakeTimers.install()

test('has unchanging initial value via `init`', () => {
  let $store = atom('initial')
  equal($store.init, 'initial')
  equal($store.value, 'initial')
  equal($store.get(), 'initial')
  $store.set('changed')
  equal($store.init, 'initial')
  equal($store.value, 'changed')
  equal($store.get(), 'changed')
})

test('listens', () => {
  let calls = 0
  let $store = atom({ some: { path: 0 } })
  let unbind = $store.listen(value => {
    calls += 1
    equal(value, $store.get())
  })

  $store.set({ some: { path: 1 } })
  $store.set({ some: { path: 2 } })
  deepStrictEqual($store.get(), { some: { path: 2 } })
  equal(calls, 2)
  unbind()
})

test('subscribes', () => {
  let calls = 0
  let $store = atom({ some: { path: 0 } })
  let unbind = $store.subscribe(value => {
    calls += 1
    equal(value, $store.get())
  })

  $store.set({ some: { path: 1 } })
  $store.set({ some: { path: 2 } })
  deepStrictEqual($store.get(), { some: { path: 2 } })
  equal(calls, 3)
  unbind()
})

test('has default value', () => {
  let events: any[] = []
  let $time = atom()
  equal($time.value, undefined)
  $time.listen(() => {})
  $time.listen(() => {})
  $time.listen(() => {})
  let unbind = $time.subscribe(value => {
    events.push(value)
  })
  $time.set({ test: 2 })
  $time.set({ test: 3 })
  deepStrictEqual($time.value, { test: 3 })
  deepStrictEqual(events, [undefined, { test: 2 }, { test: 3 }])
  unbind()
})

test('initializes store when it has listeners', () => {
  let events: string[] = []

  let $store = atom<string | undefined>('')

  onMount($store, () => {
    $store.set('initial')
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  equal(events.length, 0)

  let unbind1 = $store.listen(value => {
    events.push(`1: ${value}`)
  })
  deepStrictEqual(events, ['init'])

  let unbind2 = $store.listen(value => {
    events.push(`2: ${value}`)
  })
  deepStrictEqual(events, ['init'])

  $store.set('new')
  deepStrictEqual(events, ['init', '1: new', '2: new'])

  unbind1()
  clock.runAll()
  deepStrictEqual(events, ['init', '1: new', '2: new'])

  $store.set('new2')
  deepStrictEqual(events, ['init', '1: new', '2: new', '2: new2'])

  unbind2()
  deepStrictEqual(events, ['init', '1: new', '2: new', '2: new2'])

  let unbind3 = $store.listen(() => {})
  clock.runAll()
  deepStrictEqual(events, ['init', '1: new', '2: new', '2: new2'])

  unbind3()
  deepStrictEqual(events, ['init', '1: new', '2: new', '2: new2'])

  clock.runAll()
  deepStrictEqual(events, ['init', '1: new', '2: new', '2: new2', 'destroy'])
})

test('supports complicated case of last unsubscribing', () => {
  let events: string[] = []

  let $store = atom<string | undefined>()

  onMount($store, () => {
    return () => {
      events.push('destroy')
    }
  })

  let unbind1 = $store.listen(() => {})
  unbind1()

  let unbind2 = $store.listen(() => {})
  unbind2()

  clock.runAll()
  deepStrictEqual(events, ['destroy'])
})

test('supports the same listeners', () => {
  let events: (string | undefined)[] = []
  function listener(value: string | undefined): void {
    events.push(value)
  }

  let $store = atom<string | undefined>()

  onMount($store, () => {
    return () => {
      events.push('destroy')
    }
  })

  let unbind1 = $store.listen(listener)
  let unbind2 = $store.listen(listener)
  $store.set('1')
  deepStrictEqual(events, ['1', '1'])

  unbind1()
  clock.runAll()
  $store.set('2')
  deepStrictEqual(events, ['1', '1', '2'])

  unbind2()
  clock.runAll()
  deepStrictEqual(events, ['1', '1', '2', 'destroy'])
})

test('supports double unsubscribe', () => {
  let $store = atom<string>('')
  let unbind = $store.listen(() => {})
  $store.listen(() => {})

  unbind()
  unbind()

  deepStrictEqual($store.lc, 1)
})

test('can subscribe to changes and call listener immediately', () => {
  let events: (string | undefined)[] = []

  let $store = atom<string | undefined>()

  onMount($store, () => {
    $store.set('initial')
    return () => {
      events.push('destroy')
    }
  })

  let unbind = $store.subscribe(value => {
    events.push(value)
  })
  deepStrictEqual(events, ['initial'])

  $store.set('new')
  deepStrictEqual(events, ['initial', 'new'])

  unbind()
  clock.runAll()
  deepStrictEqual(events, ['initial', 'new', 'destroy'])
})

test('supports starting store again', () => {
  let events: (string | undefined)[] = []

  let $store = atom<string | undefined>()

  onMount($store, () => {
    $store.set('0')
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  let unbind = $store.subscribe(value => {
    events.push(value)
  })

  $store.set('1')

  unbind()
  clock.runAll()

  $store.set('2')

  $store.subscribe(value => {
    events.push(value)
  })
  deepStrictEqual(events, ['init', '0', '1', 'destroy', 'init', '0'])
})

test('works without initializer', () => {
  let events: (string | undefined)[] = []

  let $store = atom<string | undefined>()

  let unbind = $store.subscribe(value => {
    events.push(value)
  })
  deepStrictEqual(events, [undefined])

  $store.set('new')
  deepStrictEqual(events, [undefined, 'new'])

  unbind()
  clock.runAll()
})

test('supports conditional destroy', () => {
  let events: string[] = []

  let destroyable = true
  let $store = atom<string | undefined>()

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
  clock.runAll()
  deepStrictEqual(events, ['init', 'destroy'])

  destroyable = false
  let unbind2 = $store.listen(() => {})
  unbind2()
  clock.runAll()
  deepStrictEqual(events, ['init', 'destroy', 'init'])
})

test('does not run queued listeners after they are unsubscribed', () => {
  let events: string[] = []
  let $store = atom<number>(0)

  $store.listen(value => {
    events.push(`a${value}`)
    $store.listen(v => {
      events.push(`c${v}`)
    })
    if (value > 1) {
      unbindB()
    }
  })

  let unbindB = $store.listen(value => {
    events.push(`b${value}`)
  })

  $store.set(1)
  deepStrictEqual(events, ['a1', 'b1'])

  $store.set(2)
  deepStrictEqual(events, ['a1', 'b1', 'a2', 'c2'])
})

test('does not run queued listeners after they are unsubscribed when queue index is different from listener index', () => {
  let events: string[] = []
  let $storeA = atom<number>(0)
  let $storeB = atom<number>(0)

  $storeA.listen(value => {
    events.push(`a1_${value}`)
    $storeB.set(1)
    unbindB()
  })

  $storeA.listen(value => {
    events.push(`a2_${value}`)
  })

  let unbindB = $storeB.listen(value => {
    events.push(`b1_${value}`)
  })

  $storeA.set(1)
  deepStrictEqual(events, ['a1_1', 'a2_1'])
})

test('does not run queued listeners after they are unsubscribed after the store is modified multiple times during the same batch', () => {
  let events: string[] = []
  let $storeA = atom<number>(0)
  let $storeB = atom<number>(0)

  $storeA.listen(value => {
    events.push(`a1_${value}`)
    $storeB.set(1)
    $storeB.set(2)
    unbindB()
  })

  $storeA.listen(value => {
    events.push(`a2_${value}`)
  })

  let unbindB = $storeB.listen(value => {
    events.push(`b1_${value}`)
  })

  $storeA.set(1)
  deepStrictEqual(events, ['a1_1', 'a2_1'])
})

test('runs the right listeners after a listener in the queue that has already been called is unsubscribed', () => {
  let events: string[] = []
  let $store = atom<number>(0)

  let unbindA = $store.listen(value => {
    events.push(`a${value}`)
  })

  $store.listen(value => {
    events.push(`b${value}`)
    unbindA()
  })

  $store.listen(value => {
    events.push(`c${value}`)
  })

  $store.set(1)
  deepStrictEqual(events, ['a1', 'b1', 'c1'])

  events.length = 0
  $store.set(2)
  deepStrictEqual(events, ['b2', 'c2'])
})

test('unsubscribe works with listenerQueue when atom value contains other listener function', () => {
  let events: string[] = []
  let $store = atom<any>()

  $store.listen(() => {
    events.push('a')
    unbindC()
  })
  $store.listen(() => {
    events.push('b')
  })
  let listenerC = (): void => {
    events.push('c')
  }
  let unbindC = $store.listen(listenerC)
  $store.set(listenerC)
  deepStrictEqual(events, ['a', 'b'])
})

test('prevents notifying when new value is referentially equal to old one', () => {
  let events: (string | undefined)[] = []

  let $store = atom<string | undefined>('old')

  let unbind = $store.subscribe(value => {
    events.push(value)
  })
  deepStrictEqual(events, ['old'])

  $store.set('old')
  deepStrictEqual(events, ['old'])

  $store.set('new')
  deepStrictEqual(events, ['old', 'new'])

  unbind()
  clock.runAll()
})

test('can use previous value in listeners', () => {
  let events: (number | undefined)[] = []
  let $store = atom(0)
  let unbind = $store.listen((value, oldValue) => {
    events.push(oldValue)
  })

  $store.set(1)
  $store.set(2)
  deepStrictEqual(events, [0, 1])
  unbind()
  clock.runAll()
})

test('can use previous value in subscribers', () => {
  let events: (number | undefined)[] = []
  let $store = atom(0)
  let unbind = $store.subscribe((value, oldValue) => {
    events.push(oldValue)
  })

  $store.set(1)
  $store.set(2)
  deepStrictEqual(events, [undefined, 0, 1])
  unbind()
  clock.runAll()
})

test('has readonly helper', () => {
  let $store = atom('1')
  let $readonly = readonlyType($store)
  equal($readonly, $store)
})

test('batch fires each listener once with the final values', () => {
  let $a = atom(0)
  let events: [number, number | undefined][] = []
  let unbind = $a.listen((value, oldValue) => {
    events.push([value, oldValue])
  })

  batch(() => {
    $a.set(1)
    $a.set(2)
    $a.set(3)
  })

  equal(events.length, 1)
  equal(events[0]?.[0], 3)
  equal(events[0]?.[1], 0)
  unbind()
})

test('batch defers cross-store listeners and dedupes them', () => {
  let $a = atom(0)
  let $b = atom(0)
  let runs = 0
  let last: [number, number] = [-1, -1]

  effect([$a, $b], (a, b) => {
    runs += 1
    last = [a, b]
  })
  equal(runs, 1)

  batch(() => {
    $a.set(1)
    $b.set(2)
    $a.set(3)
    $b.set(4)
  })

  equal(runs, 2)
  deepStrictEqual(last, [3, 4])
})

test('batch on computed: derived values reflect post-batch state once', () => {
  let $a = atom(0)
  let $b = atom(0)
  let $sum = computed([$a, $b], (a, b) => a + b)
  let log: number[] = []
  let unbind = $sum.listen(value => log.push(value))

  batch(() => {
    $a.set(10)
    $b.set(5)
  })

  deepStrictEqual(log, [15])
  unbind()
})

test('nested batch flushes only at the outermost exit', () => {
  let $a = atom(0)
  let log: number[] = []
  let unbind = $a.listen(value => log.push(value))

  batch(() => {
    $a.set(1)
    batch(() => {
      $a.set(2)
      $a.set(3)
    })
    equal(log.length, 0)
    $a.set(4)
  })

  deepStrictEqual(log, [4])
  unbind()
})

test('batch outside any listener is identical to a single set', () => {
  let $a = atom(0)
  let log: number[] = []
  let unbind = $a.listen(value => log.push(value))

  batch(() => {
    $a.set(1)
  })

  deepStrictEqual(log, [1])

  $a.set(2)
  deepStrictEqual(log, [1, 2])
  unbind()
})

test('batch coalesces sets driven through a generator', () => {
  let $a = atom(0)
  let events: [number, number | undefined][] = []
  let unbind = $a.listen((value, oldValue) => {
    events.push([value, oldValue])
  })

  function* gen(): Generator<void, void, unknown> {
    $a.set(1)
    yield
    $a.set(2)
    yield
    $a.set(3)
  }

  batch(() => {
    let it = gen()
    let step = it.next()
    while (!step.done) {
      equal(events.length, 0)
      step = it.next()
    }
  })

  equal(events.length, 1)
  equal(events[0]?.[0], 3)
  equal(events[0]?.[1], 0)
  unbind()
})

test('exception inside batch still flushes pending listeners', () => {
  let $a = atom(0)
  let log: number[] = []
  let unbind = $a.listen(value => log.push(value))

  let threw = false
  try {
    batch(() => {
      $a.set(1)
      throw new Error('boom')
    })
  } catch {
    threw = true
  }

  equal(threw, true)
  deepStrictEqual(log, [1])
  unbind()
})

test('batch does not affect non-batched single-set behavior', () => {
  let $a = atom(0)
  let $b = atom(0)
  let log: string[] = []
  let unbindA = $a.listen(v => log.push(`a=${v}`))
  let unbindB = $b.listen(v => log.push(`b=${v}`))

  $a.set(1)
  $b.set(2)
  deepStrictEqual(log, ['a=1', 'b=2'])

  unbindA()
  unbindB()
})

test('notify defers drain while batchSeen is active', () => {
  let $a = atom(0)
  let calls: number[] = []
  let unbind = $a.listen(value => calls.push(value))

  batch(() => {
    $a.set(1)
    equal(calls.length, 0)
    $a.notify(0)
    equal(calls.length, 0)
  })

  equal(calls.length, 1)
  unbind()
})

test('notify dedupes the same listener across atoms in a batch', () => {
  let $a = atom(0)
  let $b = atom(0)
  let calls = 0
  let listener = (): void => {
    calls += 1
  }
  let unbindA = $a.listen(listener)
  let unbindB = $b.listen(listener)

  batch(() => {
    $a.set(1)
    $b.set(2)
  })

  equal(calls, 1)
  unbindA()
  unbindB()
})

test('listenKeys fires once with undefined key inside a batch', () => {
  let $user = map({ age: 0, name: 'A' })
  let nameKey: unknown[] = []
  let ageKey: unknown[] = []
  let unbindName = listenKeys($user, ['name'], (_v, _o, k) => nameKey.push(k))
  let unbindAge = listenKeys($user, ['age'], (_v, _o, k) => ageKey.push(k))

  batch(() => {
    $user.setKey('name', 'B')
    $user.setKey('age', 1)
  })

  deepStrictEqual(nameKey, [undefined])
  deepStrictEqual(ageKey, [undefined])

  unbindName()
  unbindAge()
})

test('batch dedupes repeated setKey on the same key', () => {
  let $user = map({ age: 0, name: 'A' })
  let names: string[] = []
  let unbind = $user.listen(v => names.push(v.name))

  batch(() => {
    $user.setKey('name', 'B')
    batch(() => {
      $user.setKey('name', 'C')
      $user.setKey('name', 'D')
    })
    equal(names.length, 0)
    $user.setKey('name', 'E')
  })

  deepStrictEqual(names, ['E'])
  unbind()
})

test('batch coalesces setKey on different keys into one undefined-key call', () => {
  let $user = map({ age: 0, name: 'A' })
  let calls: [string, number, unknown][] = []
  let unbind = $user.listen((v, _o, k) => calls.push([v.name, v.age, k]))

  batch(() => {
    $user.setKey('name', 'B')
    $user.setKey('age', 1)
  })

  deepStrictEqual(calls, [['B', 1, undefined]])
  unbind()
})

test('batch dedupes whole-store map.set notifications', () => {
  let $user = map({ age: 0, name: 'A' })
  let calls: string[] = []
  let unbind = $user.listen((_v, _o, k) => calls.push(k))

  batch(() => {
    $user.set({ name: 'B', age: 1 })
    $user.set({ name: 'C', age: 2 })
  })

  deepStrictEqual(calls, [undefined])
  unbind()
})
