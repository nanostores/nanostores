import FakeTimers, { InstalledClock } from '@sinonjs/fake-timers'
import { equal, ok } from 'uvu/assert'
import { test } from 'uvu'

import {
  STORE_UNMOUNT_DELAY,
  StoreValue,
  computed,
  onMount,
  atom
} from '../index.js'

let clock: InstalledClock

test.before(() => {
  clock = FakeTimers.install()
})

test.after(() => {
  clock.uninstall()
})

test('converts stores values', () => {
  let letter = atom<{ letter: string }>({ letter: 'a' })
  let number = atom<{ number: number }>({ number: 0 })

  let renders = 0
  let combine = computed([letter, number], (letterValue, numberValue) => {
    renders += 1
    return `${letterValue.letter} ${numberValue.number}`
  })
  equal(renders, 0)

  let value: StoreValue<typeof combine> = ''
  let unbind = combine.subscribe(combineValue => {
    value = combineValue
  })
  equal(value, 'a 0')
  equal(renders, 1)

  letter.set({ letter: 'b' })
  equal(value, 'b 0')
  equal(renders, 2)

  number.set({ number: 1 })
  equal(value, 'b 1')
  equal(renders, 3)

  unbind()
  clock.runAll()
  equal(value, 'b 1')
  equal(renders, 3)
})

test('works with single store', () => {
  let number = atom<number>(1)
  let decimal = computed(number, count => {
    return count * 10
  })

  let value
  let unbind = decimal.subscribe(decimalValue => {
    value = decimalValue
  })
  equal(value, 10)

  number.set(2)
  equal(value, 20)

  unbind()
})

let replacer =
  (...args: [string, string]) =>
  (v: string) =>
    v.replace(...args)

test('prevents diamond dependency problem 1', () => {
  let store = atom<number>(0)
  let values: string[] = []

  let a = computed(store, v => `a${v}`)
  let b = computed(a, replacer('a', 'b'))
  let c = computed(a, replacer('a', 'c'))
  let d = computed(a, replacer('a', 'd'))

  let combined = computed([b, c, d], ($b, $c, $d) => `${$b}${$c}${$d}`)

  let unsubscribe = combined.subscribe(v => {
    values.push(v)
  })

  equal(values, ['b0c0d0'])

  store.set(1)
  store.set(2)

  equal(values, ['b0c0d0', 'b1c1d1', 'b2c2d2'])

  unsubscribe()
})

test('prevents diamond dependency problem 2', () => {
  let store = atom<number>(0)
  let values: string[] = []

  let a = computed(store, v => `a${v}`)
  let b = computed(a, replacer('a', 'b'))
  let c = computed(b, replacer('b', 'c'))
  let d = computed(c, replacer('c', 'd'))
  let e = computed(d, replacer('d', 'e'))

  let combined = computed([a, e], (...args) => args.join(''))

  let unsubscribe = combined.subscribe(v => {
    values.push(v)
  })

  equal(values, ['a0e0'])

  store.set(1)
  equal(values, ['a0e0', 'a1e1'])

  unsubscribe()
})

test('prevents diamond dependency problem 3', () => {
  let store = atom<number>(0)
  let values: string[] = []

  let a = computed(store, $store => `a${$store}`)
  let b = computed(a, replacer('a', 'b'))
  let c = computed(b, replacer('b', 'c'))
  let d = computed(c, replacer('c', 'd'))

  let combined = computed(
    [a, b, c, d],
    ($a, $b, $c, $d) => `${$a}${$b}${$c}${$d}`
  )

  let unsubscribe = combined.subscribe(v => {
    values.push(v)
  })

  equal(values, ['a0b0c0d0'])

  store.set(1)
  equal(values, ['a0b0c0d0', 'a1b1c1d1'])

  unsubscribe()
})

test('prevents diamond dependency problem 4 (complex)', () => {
  let store1 = atom<number>(0)
  let store2 = atom<number>(0)
  let values: string[] = []

  let fn =
    (name: string) =>
    (...v: (string | number)[]) =>
      `${name}${v.join('')}`

  let a = computed(store1, fn('a'))
  let b = computed(store2, fn('b'))

  let c = computed([a, b], fn('c'))
  let d = computed(a, fn('d'))

  let e = computed([c, d], fn('e'))

  let f = computed(e, fn('f'))
  let g = computed(f, fn('g'))

  let combined1 = computed(e, (...args) => args.join(''))
  let combined2 = computed([e, g], (...args) => args.join(''))

  let unsubscribe1 = combined1.subscribe(v => {
    values.push(v)
  })

  let unsubscribe2 = combined2.subscribe(v => {
    values.push(v)
  })

  equal(values, ['eca0b0da0', 'eca0b0da0gfeca0b0da0'])

  store1.set(1)
  store2.set(2)

  equal(values, [
    'eca0b0da0',
    'eca0b0da0gfeca0b0da0',
    'eca1b0da1',
    'eca1b0da1gfeca1b0da1',
    'eca1b2da1',
    'eca1b2da1gfeca1b2da1'
  ])

  unsubscribe1()
  unsubscribe2()
})

test('prevents diamond dependency problem 5', () => {
  let events = ''
  let firstName = atom('John')
  let lastName = atom('Doe')
  let fullName = computed([firstName, lastName], (first, last) => {
    events += 'full '
    return `${first} ${last}`
  })
  let isFirstShort = computed(firstName, name => {
    events += 'short '
    return name.length < 10
  })
  let displayName = computed(
    [firstName, isFirstShort, fullName],
    (first, isShort, full) => {
      events += 'display '
      return isShort ? full : first
    }
  )

  equal(events, '')

  displayName.listen(() => {})
  equal(displayName.get(), 'John Doe')
  equal(events, 'short full display ')

  firstName.set('Benedict')
  equal(displayName.get(), 'Benedict Doe')
  equal(events, 'short full display short full display ')

  firstName.set('Montgomery')
  equal(displayName.get(), 'Montgomery')
  equal(events, 'short full display short full display short full display ')
})

test('prevents diamond dependency problem 6', () => {
  let store1 = atom<number>(0)
  let store2 = atom<number>(0)
  let values: string[] = []

  let a = computed(store1, v => `a${v}`)
  let b = computed(store2, v => `b${v}`)
  let c = computed(b, v => v.replace('b', 'c'))

  let combined = computed([a, c], ($a, $c) => `${$a}${$c}`)

  let unsubscribe = combined.subscribe(v => {
    values.push(v)
  })

  equal(values, ['a0c0'])

  store1.set(1)
  equal(values, ['a0c0', 'a1c0'])

  unsubscribe()
})

test('prevents dependency listeners from being out of order', () => {
  let base = atom(0)
  let a = computed(base, $base => {
    return `${$base}a`
  })
  let b = computed(a, $a => {
    return `${$a}b`
  })

  equal(b.get(), '0ab')
  let values: string[] = []
  let unsubscribe = b.subscribe($b => values.push($b))
  equal(values, ['0ab'])

  clock.tick(STORE_UNMOUNT_DELAY * 2)
  equal(a.get(), '0a')
  base.set(1)
  equal(values, ['0ab', '1ab'])

  unsubscribe()
})

test('notifies when stores change within the same notifyId', () => {
  let val$ = atom(1)

  let computed1$ = computed(val$, val => {
    return val
  })

  let computed2$ = computed(computed1$, computed1 => {
    return computed1
  })

  let events: any[] = []
  val$.subscribe(val => events.push({ val }))
  computed2$.subscribe(computed2 => {
    events.push({ computed2 })
    if (computed2 % 2 === 1) {
      val$.set(val$.get() + 1)
    }
  })

  equal(events, [{ val: 1 }, { computed2: 1 }, { val: 2 }, { computed2: 2 }])

  val$.set(3)
  equal(events, [
    { val: 1 },
    { computed2: 1 },
    { val: 2 },
    { computed2: 2 },
    { val: 3 },
    { computed2: 3 },
    { val: 4 },
    { computed2: 4 }
  ])
})

test('is compatible with onMount', () => {
  let store = atom(1)
  let deferrer = computed(store, value => value * 2)

  let events = ''
  onMount(deferrer, () => {
    events += 'init '
    return () => {
      events += 'destroy '
    }
  })
  equal(events, '')

  let deferrerValue: number | undefined
  let unbind = deferrer.subscribe(value => {
    deferrerValue = value
  })
  clock.runAll()
  ok(deferrer.lc > 0)
  equal(deferrer.get(), store.get() * 2)
  equal(deferrerValue, store.get() * 2)
  ok(store.lc > 0)
  equal(events, 'init ')

  store.set(3)
  equal(deferrer.get(), store.get() * 2)
  equal(deferrerValue, store.get() * 2)

  unbind()
  clock.runAll()
  equal(deferrer.lc, 0)
  equal(events, 'init destroy ')
})

test.run()
