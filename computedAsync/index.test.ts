import FakeTimers from '@sinonjs/fake-timers'
import { deepStrictEqual, equal, ok } from 'node:assert'
import { test } from 'node:test'
import * as timers from 'node:timers/promises'

import {
  allTasks,
  type AsyncValue,
  atom,
  computedAsync,
  computedAsyncNoCascade,
  onMount,
  STORE_UNMOUNT_DELAY,
  type StoreValue,
} from '../index.js'

const clock = FakeTimers.install()

let replacer =
  (...args: [string, string]) =>
    (v: string) =>
      v.replace(...args)

test('works with single store', async () => {
  let $number = atom<number>(1)
  let $decimal = computedAsync($number, count => {
    return count * 10
  })

  let value
  let unsubscribe = $decimal.subscribe(decimalValue => {
    value = decimalValue
  })
  deepStrictEqual(value, { state: 'loading' })
  await allTasks()
  deepStrictEqual(value, { changing: false, state: 'loaded', value: 10 })

  $number.set(2)
  deepStrictEqual(value, { changing: true, state: 'loaded', value: 10 })
  await allTasks()
  deepStrictEqual(value, { changing: false, state: 'loaded', value: 20 })

  unsubscribe()
})

test('works with multiple stores', async () => {
  let $letter = atom<{ letter: string }>({ letter: 'a' })
  let $number = atom<{ number: number }>({ number: 0 })

  let renders = 0
  let $combine = computedAsync([$letter, $number], (letterValue, numberValue) => {
    renders += 1
    return `${letterValue.letter} ${numberValue.number}`
  })
  deepStrictEqual(renders, 0)

  let values: StoreValue<typeof $combine>[] = [];
  let unsubscribe = $combine.subscribe(combineValue => {
    values.push(combineValue);
  })

  deepStrictEqual(values, [{ state: 'loading' }])
  deepStrictEqual(renders, 0)

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a 0' },
  ])
  deepStrictEqual(renders, 1)

  $letter.set({ letter: 'b' })
  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a 0' },
    { changing: true, state: 'loaded', value: 'a 0' },
  ])
  deepStrictEqual(renders, 1)

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a 0' },
    { changing: true, state: 'loaded', value: 'a 0' },
    { changing: false, state: 'loaded', value: 'b 0' },
  ])
  deepStrictEqual(renders, 2)

  $number.set({ number: 1 })
  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a 0' },
    { changing: true, state: 'loaded', value: 'a 0' },
    { changing: false, state: 'loaded', value: 'b 0' },
    { changing: true, state: 'loaded', value: 'b 0' },
  ])
  deepStrictEqual(renders, 2)

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a 0' },
    { changing: true, state: 'loaded', value: 'a 0' },
    { changing: false, state: 'loaded', value: 'b 0' },
    { changing: true, state: 'loaded', value: 'b 0' },
    { changing: false, state: 'loaded', value: 'b 1' },
  ])
  deepStrictEqual(renders, 3)

  unsubscribe()
})

test('handles errors as a state', async () => {
  let $atom = atom<number>(1)
  let $computed = computedAsync($atom, value => {
    if (value % 2 === 0) {
      throw new Error('Even number')
    }
    return value * 2
  })

  let values: AsyncValue<number>[] = []
  let unsubscribe = $computed.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, [{ state: 'loading' }])

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { state: 'loaded', changing: false, value: 2 },
  ])

  $atom.set(2)

  deepStrictEqual(values, [
    { state: 'loading' },
    { state: 'loaded', changing: false, value: 2 },
    { state: 'loaded', changing: true, value: 2 },
  ]);

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { state: 'loaded', changing: false, value: 2 },
    { state: 'loaded', changing: true, value: 2 },
    { state: 'failed', changing: false, error: new Error('Even number') },
  ]);

  unsubscribe()
})

test('cascade changing state across computed async stores', async () => {
  let $atom = atom<number>(1)
  let inputs1: number[] = []
  let $computed1 = computedAsync($atom, value => {
    inputs1.push(value)
    return value * 2
  })
  let inputs2: number[] = []
  let $computed2 = computedAsync($computed1, value => {
    inputs2.push(value)
    return value * 2
  })

  let unsubscribe = $computed2.subscribe(() => { })

  await allTasks()

  deepStrictEqual(inputs1, [1])
  deepStrictEqual(inputs2, [2])

  deepStrictEqual(
    $computed1.get(),
    { changing: false, state: 'loaded', value: 2 },
  )
  deepStrictEqual(
    $computed2.get(),
    { changing: false, state: 'loaded', value: 4 },
  )

  $atom.set(2)

  deepStrictEqual(inputs1, [1])
  deepStrictEqual(inputs2, [2])

  deepStrictEqual(
    $computed1.get(),
    { changing: true, state: 'loaded', value: 2 },
  )
  deepStrictEqual(
    $computed2.get(),
    { changing: true, state: 'loaded', value: 4 },
  )

  await allTasks()

  deepStrictEqual(inputs1, [1, 2])
  deepStrictEqual(inputs2, [2, 4])

  deepStrictEqual(
    $computed1.get(),
    { changing: false, state: 'loaded', value: 4 },
  )
  deepStrictEqual(
    $computed2.get(),
    { changing: false, state: 'loaded', value: 8 },
  )

  unsubscribe()
})

test('cascade error state across computed async stores', async () => {
  let $atom = atom<number>(1)
  let $computed1 = computedAsync($atom, value => {
    if (value % 2 === 0) {
      throw new Error('Even number')
    }
    return value * 2
  })
  let $computed2 = computedAsync($computed1, value => {
    return value * 2
  })

  let values: AsyncValue<number>[] = []
  let unsubscribe = $computed2.subscribe((v) => {
    values.push(v)
  })

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { state: 'loaded', changing: false, value: 4 },
  ])

  $atom.set(2)

  deepStrictEqual(values, [
    { state: 'loading' },
    { state: 'loaded', changing: false, value: 4 },
    { state: 'loaded', changing: true, value: 4 },
  ])

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { state: 'loaded', changing: false, value: 4 },
    { state: 'loaded', changing: true, value: 4 },
    { state: 'failed', changing: false, error: new Error('Even number') },
  ])

  unsubscribe()
})

test('does not cascade changing state in no cascade mode', async () => {
  let $atom = atom<number>(1)
  let inputs1: number[] = []
  let $computed1 = computedAsync($atom, value => {
    inputs1.push(value)
    return timers.setTimeout(10, value * 2)
  })
  let inputs2: AsyncValue<number>[] = []
  let $computed2 = computedAsyncNoCascade($computed1, value => {
    inputs2.push(value)
    return value
  })

  let outputs: AsyncValue<AsyncValue<number>>[] = []
  let unsubscribe = $computed2.subscribe(v => {
    outputs.push(v)
  })

  await allTasks()

  deepStrictEqual(inputs1, [1])
  deepStrictEqual(inputs2, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 2 },
  ])
  deepStrictEqual(outputs, [
    { state: 'loading' },
    {
      changing: false, state: 'loaded', value: {
        state: 'loading'
      }
    },
    {
      changing: true, state: 'loaded', value: {
        state: 'loading'
      }
    },
    {
      changing: false, state: 'loaded', value: {
        changing: false, state: 'loaded', value: 2
      }
    },
  ])

  $atom.set(2)

  deepStrictEqual(inputs1, [1])
  deepStrictEqual(inputs2, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 2 },
  ])
  deepStrictEqual(outputs, [
    { state: 'loading' },
    {
      changing: false, state: 'loaded', value: {
        state: 'loading'
      }
    },
    {
      changing: true, state: 'loaded', value: {
        state: 'loading'
      }
    },
    {
      changing: false, state: 'loaded', value: {
        changing: false, state: 'loaded', value: 2
      }
    },
    {
      changing: true, state: 'loaded', value: {
        changing: false, state: 'loaded', value: 2
      }
    },
  ])

  await allTasks()

  deepStrictEqual(inputs1, [1, 2])
  deepStrictEqual(inputs2, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 2 },
    { changing: true, state: 'loaded', value: 2 },
    { changing: false, state: 'loaded', value: 4 },
  ])
  deepStrictEqual(outputs, [
    { state: 'loading' },
    {
      changing: false, state: 'loaded', value: {
        state: 'loading'
      }
    },
    {
      changing: true, state: 'loaded', value: {
        state: 'loading'
      }
    },
    {
      changing: false, state: 'loaded', value: {
        changing: false, state: 'loaded', value: 2
      }
    },
    {
      changing: true, state: 'loaded', value: {
        changing: false, state: 'loaded', value: 2
      }
    },
    {
      changing: false, state: 'loaded', value: {
        changing: true, state: 'loaded', value: 2
      }
    },
    {
      changing: true, state: 'loaded', value: {
        changing: true, state: 'loaded', value: 2
      }
    },
    {
      changing: false, state: 'loaded', value: {
        changing: false, state: 'loaded', value: 4
      }
    },
  ])

  unsubscribe()
})

test('prevents diamond dependency problem 1', async () => {
  let $store = atom<number>(0)
  let values: AsyncValue<string>[] = []

  let $a = computedAsync($store, v => `a${v}`)
  let $b = computedAsync($a, replacer('a', 'b'))
  let $c = computedAsync($a, replacer('a', 'c'))
  let $d = computedAsync($a, replacer('a', 'd'))

  let renders = 0
  let $combined = computedAsync([$b, $c, $d], (b, c, d) => {
    renders += 1
    // Make it async to simulate state promises being involved
    return timers.setImmediate(`${b}${c}${d}`)
  })

  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, [{ state: 'loading' }])

  await allTasks()
  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'b0c0d0' },
  ])

  $store.set(1)
  $store.set(2)

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'b0c0d0' },
    { changing: true, state: 'loaded', value: 'b0c0d0' },
  ])

  await allTasks()

  deepStrictEqual(renders, 2)
  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'b0c0d0' },
    { changing: true, state: 'loaded', value: 'b0c0d0' },
    // Intermediary states (1) are never observed
    { changing: false, state: 'loaded', value: 'b2c2d2' },
  ])

  unsubscribe()
})

test('prevents diamond dependency problem 2', async () => {
  let $store = atom<number>(0)

  let $a = computedAsync($store, v => `a${v}`)
  let $b = computedAsync($a, replacer('a', 'b'))
  let $c = computedAsync($b, replacer('b', 'c'))
  let $d = computedAsync($c, replacer('c', 'd'))
  let $e = computedAsync($d, replacer('d', 'e'))

  let $combined = computedAsync([$a, $e], (...args) => args.join(''))

  let values: AsyncValue<string>[] = []
  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, [{ state: 'loading' }])

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a0e0' },
  ])

  $store.set(1)

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a0e0' },
    { changing: true, state: 'loaded', value: 'a0e0' },
  ])

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a0e0' },
    { changing: true, state: 'loaded', value: 'a0e0' },
    { changing: false, state: 'loaded', value: 'a1e1' },
  ])

  unsubscribe()
})

test('prevents diamond dependency problem 3', async () => {
  let $store = atom<number>(0)

  let $a = computedAsync($store, store => `a${store}`)
  let $b = computedAsync($a, replacer('a', 'b'))
  let $c = computedAsync($b, replacer('b', 'c'))
  let $d = computedAsync($c, replacer('c', 'd'))

  let $combined = computedAsync([$a, $b, $c, $d], (a, b, c, d) => `${a}${b}${c}${d}`)

  let values: AsyncValue<string>[] = []
  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, [{ state: 'loading' }])

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a0b0c0d0' },
  ])

  $store.set(1)

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a0b0c0d0' },
    { changing: true, state: 'loaded', value: 'a0b0c0d0' },
  ])

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a0b0c0d0' },
    { changing: true, state: 'loaded', value: 'a0b0c0d0' },
    { changing: false, state: 'loaded', value: 'a1b1c1d1' },
  ])

  unsubscribe()
})

test('prevents diamond dependency problem 4 (complex)', async () => {
  let $store1 = atom<number>(0)
  let $store2 = atom<number>(0)

  let fn =
    (name: string) =>
      (...v: (number | string)[]) =>
        `${name}${v.join('')}`

  let $a = computedAsync($store1, fn('a'))
  let $b = computedAsync($store2, fn('b'))

  let $c = computedAsync([$a, $b], fn('c'))
  let $d = computedAsync($a, fn('d'))

  let $e = computedAsync([$c, $d], fn('e'))

  let $f = computedAsync($e, fn('f'))
  let $g = computedAsync($f, fn('g'))

  let $combined1 = computedAsync($e, (...args) => args.join(''))
  let $combined2 = computedAsync([$e, $g], (...args) => args.join(''))

  let values: AsyncValue<string>[] = []

  let unsubscribe1 = $combined1.subscribe(v => {
    values.push(v)
  })

  let unsubscribe2 = $combined2.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, [
    { state: 'loading' },
    { state: 'loading' },
  ])

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'eca0b0da0' },
    { changing: false, state: 'loaded', value: 'eca0b0da0gfeca0b0da0' },
  ])

  $store1.set(1)
  $store2.set(2)

  deepStrictEqual(values, [
    { state: 'loading' },
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'eca0b0da0' },
    { changing: false, state: 'loaded', value: 'eca0b0da0gfeca0b0da0' },
    { changing: true, state: 'loaded', value: 'eca0b0da0' },
    { changing: true, state: 'loaded', value: 'eca0b0da0gfeca0b0da0' },
  ])

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'eca0b0da0' },
    { changing: false, state: 'loaded', value: 'eca0b0da0gfeca0b0da0' },
    { changing: true, state: 'loaded', value: 'eca0b0da0' },
    { changing: true, state: 'loaded', value: 'eca0b0da0gfeca0b0da0' },
    { changing: false, state: 'loaded', value: 'eca1b2da1' },
    { changing: false, state: 'loaded', value: 'eca1b2da1gfeca1b2da1' },
  ])

  unsubscribe1()
  unsubscribe2()
})

test('prevents diamond dependency problem 5', async () => {
  let events = ''
  let $firstName = atom('John')
  let $lastName = atom('Doe')
  let $fullName = computedAsync([$firstName, $lastName], (first, last) => {
    events += 'full '
    return `${first} ${last}`
  })
  let $isFirstShort = computedAsync($firstName, name => {
    events += 'short '
    return name.length < 10
  })
  let $displayName = computedAsync(
    [$firstName, $isFirstShort, $fullName],
    (first, isShort, full) => {
      events += 'display '
      return isShort ? full : first
    }
  )

  equal(events, '')

  $displayName.listen(() => { })

  await allTasks()

  deepStrictEqual(
    $displayName.get(),
    { changing: false, state: 'loaded', value: 'John Doe' },
  )

  equal(events, 'short full display ')

  $firstName.set('Benedict')

  await allTasks()

  deepStrictEqual(
    $displayName.get(),
    { changing: false, state: 'loaded', value: 'Benedict Doe' },
  )
  equal(events, 'short full display short full display ')

  $firstName.set('Montgomery')

  await allTasks()

  deepStrictEqual(
    $displayName.get(),
    { changing: false, state: 'loaded', value: 'Montgomery' },
  )
  equal(events, 'short full display short full display short full display ')
})

test('prevents diamond dependency problem 6', async () => {
  let $store1 = atom<number>(0)
  let $store2 = atom<number>(0)

  let $a = computedAsync($store1, v => `a${v}`)
  let $b = computedAsync($store2, v => `b${v}`)
  let $c = computedAsync($b, v => v.replace('b', 'c'))

  let $combined = computedAsync([$a, $c], (a, c) => `${a}${c}`)

  let values: AsyncValue<string>[] = []
  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, [{ state: 'loading' }])

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a0c0' },
  ])

  $store1.set(1)

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a0c0' },
    { changing: true, state: 'loaded', value: 'a0c0' },
  ])

  await allTasks()

  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: 'a0c0' },
    { changing: true, state: 'loaded', value: 'a0c0' },
    { changing: false, state: 'loaded', value: 'a1c0' },
  ])

  unsubscribe()
})

test('prevents dependency listeners from being out of order', async () => {
  let $base = atom(0)
  let $a = computedAsync($base, base => {
    return `${base}a`
  })
  let $b = computedAsync($a, a => {
    return `${a}b`
  })

  deepStrictEqual($b.get(), { state: 'loading' })


  await allTasks()

  deepStrictEqual(
    $b.get(),
    { changing: false, state: 'loaded', value: '0ab' },
  )

  let values: AsyncValue<string>[] = []
  let unsubscribe = $b.subscribe(b => values.push(b))
  deepStrictEqual(values, [
    { changing: false, state: 'loaded', value: '0ab' },
  ])

  clock.tick(STORE_UNMOUNT_DELAY * 2)
  deepStrictEqual(
    $a.get(),
    { changing: false, state: 'loaded', value: '0a' },
  )
  $base.set(1)
  deepStrictEqual(values, [
    { changing: false, state: 'loaded', value: '0ab' },
    { changing: true, state: 'loaded', value: '0ab' },
  ])

  await allTasks()

  deepStrictEqual(values, [
    { changing: false, state: 'loaded', value: '0ab' },
    { changing: true, state: 'loaded', value: '0ab' },
    { changing: false, state: 'loaded', value: '1ab' },
  ])

  unsubscribe()
})

test('notifies when stores change within the same notifyId', async () => {
  let $val = atom(1)

  let $computed1 = computedAsync($val, val => {
    return val
  })

  let $computed2 = computedAsync($computed1, computed1 => {
    return computed1
  })

  let events: any[] = []
  $val.subscribe(val => events.push({ val }))
  $computed2.subscribe(computed2 => {
    events.push({ computed2 })
    if (
      computed2.state === 'loaded'
      && !computed2.changing
      && computed2.value % 2 === 1
    ) {
      $val.set($val.get() + 1)
    }
  })

  deepStrictEqual(events, [
    { val: 1 },
    { computed2: { state: 'loading' } },
  ])

  await allTasks()

  deepStrictEqual(events, [
    { val: 1 },
    { computed2: { state: 'loading' } },
    { computed2: { changing: false, state: 'loaded', value: 1 } },
    { val: 2 },
    { computed2: { changing: true, state: 'loaded', value: 1 } },
    { computed2: { changing: false, state: 'loaded', value: 2 } },
  ])

  $val.set(3)

  deepStrictEqual(events, [
    { val: 1 },
    { computed2: { state: 'loading' } },
    { computed2: { changing: false, state: 'loaded', value: 1 } },
    { val: 2 },
    { computed2: { changing: true, state: 'loaded', value: 1 } },
    { computed2: { changing: false, state: 'loaded', value: 2 } },
    { val: 3 },
    { computed2: { changing: true, state: 'loaded', value: 2 } },
  ])

  await allTasks()

  deepStrictEqual(events, [
    { val: 1 },
    { computed2: { state: 'loading' } },
    { computed2: { changing: false, state: 'loaded', value: 1 } },
    { val: 2 },
    { computed2: { changing: true, state: 'loaded', value: 1 } },
    { computed2: { changing: false, state: 'loaded', value: 2 } },
    { val: 3 },
    { computed2: { changing: true, state: 'loaded', value: 2 } },
    { computed2: { changing: false, state: 'loaded', value: 3 } },
    { val: 4 },
    { computed2: { changing: true, state: 'loaded', value: 3 } },
    { computed2: { changing: false, state: 'loaded', value: 4 } },
  ])
})

test('is compatible with onMount', async () => {
  let $store = atom(1)
  let $deferrer = computedAsync($store, value => value * 2)

  let events = ''
  onMount($deferrer, () => {
    events += 'init '
    return () => {
      events += 'destroy '
    }
  })
  equal(events, '')

  let deferrerValue!: number
  let unsubscribe = $deferrer.subscribe(value => {
    if (value.state === 'loaded') {
      deferrerValue = value.value
    }
  })

  await allTasks()

  ok($deferrer.lc > 0)
  equal(($deferrer.get() as any).value, $store.get() * 2)
  equal(deferrerValue, $store.get() * 2)

  ok($store.lc > 0)
  equal(events, 'init ')

  $store.set(3)

  await allTasks()

  equal(($deferrer.get() as any).value, $store.get() * 2)
  equal(deferrerValue, $store.get() * 2)

  unsubscribe()
  await allTasks()
  clock.tick(STORE_UNMOUNT_DELAY)

  equal($deferrer.lc, 0)
  equal(events, 'init destroy ')
})

test('computes initial value when argument is undefined', async () => {
  let $one = atom<string | undefined>(undefined)
  let $two = computedAsync($one, (value: string | undefined) => !!value)
  equal($one.get(), undefined)
  deepStrictEqual($two.get(), { state: 'loading' })
  await allTasks()
  deepStrictEqual($two.get(), { changing: false, state: 'loaded', value: false })
})

test('skip stale callback calls', async () => {
  let st1 = atom('1')

  let calls = 0
  let cmp = computedAsync(st1, (v1) => {
    calls += 1
    return v1
  })

  let values: AsyncValue<string>[] = []
  cmp.subscribe(v => {
    values.push(v)
  })

  await allTasks()

  equal(calls, 1)
  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: '1' },
  ])

  st1.set('2')
  st1.set('3')
  st1.set('4')

  equal(calls, 1)
  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: '1' },
    { changing: true, state: 'loaded', value: '1' },
  ])

  await allTasks()

  equal(calls, 2)
  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: false, state: 'loaded', value: '1' },
    { changing: true, state: 'loaded', value: '1' },
    { changing: false, state: 'loaded', value: '4' },
  ])
})

test('cleans up on unmount', () => {
  let $source = atom({ count: 1 })
  let $derived = computedAsync($source, s => s.count)

  equal($derived.lc, 0)
  equal($source.lc, 0)

  let unsubscribe = $derived.subscribe(() => { })

  equal($derived.lc, 1)
  equal($source.lc, 1)

  unsubscribe()
  clock.tick(STORE_UNMOUNT_DELAY)

  equal($derived.lc, 0)
  equal($source.lc, 0)
})

test('changing computed in other computed', async () => {
  let $atom = atom(1)
  let values: AsyncValue<number>[] = []
  let $computed1 = computedAsync($atom, () => {
    values.push($computed2.get())
  })
  let $computed2 = computedAsync($atom, value => value * 2)
  $computed1.subscribe(() => { })
  await allTasks()
  $atom.set(2)
  await allTasks()
  deepStrictEqual(values, [
    { state: 'loading' },
    { changing: true, state: 'loaded', value: 2 },
  ])
})
