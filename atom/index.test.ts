import FakeTimers from '@sinonjs/fake-timers'
import { deepStrictEqual, equal, throws } from 'node:assert'
import { test } from 'node:test'

import { atom, computed, onMount } from '../index.js'
import { batch } from './index.js'

let clock = FakeTimers.install()

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

test('custom isEqual: notifies when returning false, even when values are the same', () => {
  let events: (string | undefined)[] = []
  let $store = atom('old')
  $store.isEqual = () => false

  let unbind = $store.subscribe(value => {
    events.push(value)
  })
  deepStrictEqual(events, ['old'])

  $store.set('old')
  deepStrictEqual(events, ['old', 'old'])

  $store.set('new')
  deepStrictEqual(events, ['old', 'old', 'new'])

  unbind()
  clock.runAll()
})

test('custom isEqual: does not notify when returning true, even when values are different', () => {
  let events: (string | undefined)[] = []
  let $store = atom('old')
  $store.isEqual = () => true

  let unbind = $store.subscribe(value => {
    events.push(value)
  })
  deepStrictEqual(events, ['old'])

  $store.set('new')
  deepStrictEqual(events, ['old'])

  unbind()
  clock.runAll()
})

// This test fails when using === to compare instead of Object.is
test('listener is not called when value is set to NaN a second time', () => {
  let events = ""
  let $store = atom(NaN)
  let unbind = $store.subscribe(value => {
    events += value + " "
  })
  $store.set(NaN)
  deepStrictEqual(events, "NaN ")
  unbind()
  clock.runAll()
})

// This test fails when using === to compare instead of Object.is
test('listener is called when value changes from -0 to +0', () => {
  let events: number[] = []
  let $store = atom(-0)
  let unbind = $store.subscribe(value => {
    events.push(value)
  })
  $store.set(+0)
  deepStrictEqual(events, [-0, +0])
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

test('without batch', () => {
  let events = ""
  let $a = atom("a1")
  let $b = atom("b1")
  let unbind = $a.subscribe(() => {
    events += $a.get() + $b.get() + " "
  })
  $a.set("a2")
  $b.set("b2")
  equal(events, 'a1b1 a2b1 ')
  unbind()
  clock.runAll()
})

test('batch', () => {
  let events = ""
  let $a = atom("a1")
  let $b = atom("b1")
  let unbind = $a.subscribe(() => {
    events += $a.get() + $b.get() + " "
  })
  batch(() => {
    $a.set("a2")
    $b.set("b2")
  })

  equal(events, 'a1b1 a2b2 ')
  unbind()
  clock.runAll()
})

test('nested batch', () => {
  let events = ""
  let $a = atom("a1")
  let $b = atom("b1")
  let unbind = $a.subscribe(() => {
    events += $a.get() + $b.get() + " "
  })
  batch(() => {
    $a.set("a2")
    batch(() => {
      $b.set("b2")
    })
  })

  equal(events, 'a1b1 a2b2 ')
  unbind()
  clock.runAll()
})

test('batch started from listener', () => {
  let events = ""
  let $a = atom("a1")
  let $b = atom("b1")
  let unbind = $a.subscribe(() => {
    events += $a.get() + $b.get() + " "
  })
  let $c = atom()
  $c.listen(() => {
    batch(() => {
      $a.set("a2")
      $b.set("b2")
    })
  })
  $c.set("foo")

  equal(events, 'a1b1 a2b2 ')
  unbind()
  clock.runAll()
})

test('batch with computed', () => {
  let events = ""
  let $a = atom("a1")
  let $b = atom("b1")
  let $c = computed([$a, $b], (a, b) => {
    events += a + b + " "
  })
  $c.get()
  batch(() => {
    $a.set("a2")
    $b.set("b2")
  })
  equal(events, 'a1b1 a2b2 ')
  clock.runAll()
})

test('calling batch in a listener does not re-run the batched listeners', () => {
  let events = ""
  let $a = atom("a1")
  // Override isEqual so listeners will always be called, even if value hasn't changed
  $a.isEqual = () => false
  let unbind = $a.listen(value => {
    events += value
    batch(() => {})
  })
  batch(() => {
    $a.set("a2")
    $a.set("a3")
  })

  // a3 is added twice because of our custom isEqual function
  equal(events, 'a3a3')
  unbind()
  clock.runAll()
})

test('batch queue is cleared if a listener throws an exception', () => {
  let events = ""
  let $a = atom("a1")
  let $b = atom("b1")
  let unbindA = $a.listen(value => {
    events += value
    if (value === "a2") throw new Error("foo")
  })
  let unbindB = $b.listen(value => {
    events += value
  })
  throws(() => {
    batch(() => {
      $a.set("a2")
      $b.set("b2")
    })
  }, /foo/)
  $a.set("a3")

  equal(events, "a2a3")
  unbindA()
  unbindB()
  clock.runAll()
})

// If values are stored in the queue at the time notify() is called, the value passed to the listener will be stale.
// If that is fixed, but special handling doesn't exist, the listener will be called twice.
test('non-stale value passed to listener and listener only called once when atom is modified with other listeners already later in the queue', () => {
  let events = ""
  let $a = atom('0')
  let $event = atom()
  $event.listen(() => {
    $a.set('2')
  })
  $a.listen((value) => {
    events += value
  })
  batch(() => {
    $event.set("foo")
    $a.set('1')
  })
  equal(events, '2')
})

test('listener only called once when atom is modified twice in batch', () => {
  let events = ""
  let $atom = atom('1')
  $atom.listen((value) => {
    events += value
  })
  batch(() => {
    $atom.set('2')
    $atom.set('3')
  })
  equal(events, '3')
})

test('listener only called once when atom is modified twice in a listener (implicit batch)', () => {
  let events = ""
  let $event = atom()
  let $atom = atom('1')
  $atom.listen((value) => {
    events += value
  })
  $event.listen(() => {
    $atom.set('2')
    $atom.set('3')
  })
  $event.set('foo')
  equal(events, '3')
})

test('listeners see different oldValue for same batch update based on when they subscribed', () => {
  let events = ""
  let $atom = atom('a')
  $atom.listen((value, oldValue) => {
    events += value + oldValue + '1 '
  })
  batch(() => {
    $atom.set('b')
    $atom.listen((value, oldValue) => {
      events += value + oldValue + '2 '
    })
    $atom.set('c')
  })
  equal(events, 'ca1 cb2 ')
})
