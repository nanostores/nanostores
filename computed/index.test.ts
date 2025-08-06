import { deepStrictEqual, equal } from 'node:assert'
import { test } from 'node:test'

import {
  allTasks,
  atom,
  computed,
  deepMap,
  map,
  onMount,
  type StoreValue,
  task
} from '../index.js'

test('converts stores values', () => {
  let $letter = atom<{ letter: string }>({ letter: 'a' })
  let $number = atom<{ number: number }>({ number: 0 })

  let renders = 0
  let $combine = computed([$letter, $number], (letterValue, numberValue) => {
    renders += 1
    return `${letterValue.letter} ${numberValue.number}`
  })
  equal(renders, 0)

  let value: StoreValue<typeof $combine> = ''
  let unbind = $combine.subscribe(combineValue => {
    value = combineValue
  })
  equal(value, 'a 0')
  equal(renders, 1)

  $letter.set({ letter: 'b' })
  equal(value, 'b 0')
  equal(renders, 2)

  $number.set({ number: 1 })
  equal(value, 'b 1')
  equal(renders, 3)

  unbind()
  equal(value, 'b 1')
  equal(renders, 3)
})

test('works with single store', () => {
  let $number = atom<number>(1)
  let $decimal = computed($number, count => {
    return count * 10
  })

  let value
  let unbind = $decimal.subscribe(decimalValue => {
    value = decimalValue
  })
  equal(value, 10)

  $number.set(2)
  equal(value, 20)

  unbind()
})

let replacer =
  (...args: [string, string]) =>
  (v: string) =>
    v.replace(...args)

test('prevents diamond dependency problem 1', () => {
  let $store = atom<number>(0)
  let values: string[] = []

  let $a = computed($store, v => `a${v}`)
  let $b = computed($a, replacer('a', 'b'))
  let $c = computed($a, replacer('a', 'c'))
  let $d = computed($a, replacer('a', 'd'))

  let $combined = computed([$b, $c, $d], (b, c, d) => `${b}${c}${d}`)

  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, ['b0c0d0'])

  $store.set(1)
  $store.set(2)

  deepStrictEqual(values, ['b0c0d0', 'b1c1d1', 'b2c2d2'])

  unsubscribe()
})

test('prevents diamond dependency problem 2', () => {
  let $store = atom<number>(0)
  let values: string[] = []

  let $a = computed($store, v => `a${v}`)
  let $b = computed($a, replacer('a', 'b'))
  let $c = computed($b, replacer('b', 'c'))
  let $d = computed($c, replacer('c', 'd'))
  let $e = computed($d, replacer('d', 'e'))

  let $combined = computed([$a, $e], (...args) => args.join(''))

  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, ['a0e0'])

  $store.set(1)
  deepStrictEqual(values, ['a0e0', 'a1e1'])

  unsubscribe()
})

test('prevents diamond dependency problem 3', () => {
  let $store = atom<number>(0)
  let values: string[] = []

  let $a = computed($store, store => `a${store}`)
  let $b = computed($a, replacer('a', 'b'))
  let $c = computed($b, replacer('b', 'c'))
  let $d = computed($c, replacer('c', 'd'))

  let $combined = computed([$a, $b, $c, $d], (a, b, c, d) => `${a}${b}${c}${d}`)

  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, ['a0b0c0d0'])

  $store.set(1)
  deepStrictEqual(values, ['a0b0c0d0', 'a1b1c1d1'])

  unsubscribe()
})

test('prevents diamond dependency problem 4 (complex)', () => {
  let $store1 = atom<number>(0)
  let $store2 = atom<number>(0)
  let values: string[] = []

  let fn =
    (name: string) =>
    (...v: (number | string)[]) =>
      `${name}${v.join('')}`

  let $a = computed($store1, fn('a'))
  let $b = computed($store2, fn('b'))

  let $c = computed([$a, $b], fn('c'))
  let $d = computed($a, fn('d'))

  let $e = computed([$c, $d], fn('e'))

  let $f = computed($e, fn('f'))
  let $g = computed($f, fn('g'))

  let $combined1 = computed($e, (...args) => args.join(''))
  let $combined2 = computed([$e, $g], (...args) => args.join(''))

  let unsubscribe1 = $combined1.subscribe(v => {
    values.push(v)
  })

  let unsubscribe2 = $combined2.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, ['eca0b0da0', 'eca0b0da0gfeca0b0da0'])

  $store1.set(1)
  $store2.set(2)

  deepStrictEqual(values, [
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
  let $firstName = atom('John')
  let $lastName = atom('Doe')
  let $fullName = computed([$firstName, $lastName], (first, last) => {
    events += 'full '
    return `${first} ${last}`
  })
  let $isFirstShort = computed($firstName, name => {
    events += 'short '
    return name.length < 10
  })
  let $displayName = computed(
    [$firstName, $isFirstShort, $fullName],
    (first, isShort, full) => {
      events += 'display '
      return isShort ? full : first
    }
  )

  equal(events, '')

  $displayName.listen(() => {})
  equal($displayName.get(), 'John Doe')
  equal(events, 'short full display ')

  $firstName.set('Benedict')
  equal($displayName.get(), 'Benedict Doe')
  equal(events, 'short full display short full display ')

  $firstName.set('Montgomery')
  equal($displayName.get(), 'Montgomery')
  equal(events, 'short full display short full display short full display ')
})

test('prevents diamond dependency problem 6', () => {
  let $store1 = atom<number>(0)
  let $store2 = atom<number>(0)
  let values: string[] = []

  let $a = computed($store1, v => `a${v}`)
  let $b = computed($store2, v => `b${v}`)
  let $c = computed($b, v => v.replace('b', 'c'))

  let $combined = computed([$a, $c], (a, c) => `${a}${c}`)

  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  deepStrictEqual(values, ['a0c0'])

  $store1.set(1)
  deepStrictEqual(values, ['a0c0', 'a1c0'])

  unsubscribe()
})

test('prevents dependency listeners from being out of order', () => {
  let $base = atom(0)
  let $a = computed($base, base => {
    return `${base}a`
  })
  let $b = computed($a, a => {
    return `${a}b`
  })

  equal($b.get(), '0ab')
  let values: string[] = []
  let unsubscribe = $b.subscribe(b => values.push(b))
  deepStrictEqual(values, ['0ab'])

  equal($a.get(), '0a')
  $base.set(1)
  deepStrictEqual(values, ['0ab', '1ab'])

  unsubscribe()
})

test('notifies when stores change within the same notifyId', () => {
  let $val = atom(1)

  let $computed1 = computed($val, val => {
    return val
  })

  let $computed2 = computed($computed1, computed1 => {
    return computed1
  })

  let events: any[] = []
  $val.subscribe(val => events.push({ val }))
  $computed2.subscribe(computed2 => {
    events.push({ computed2 })
    if (computed2 % 2 === 1) {
      $val.set($val.get() + 1)
    }
  })

  deepStrictEqual(events, [
    { val: 1 },
    { computed2: 1 },
    { val: 2 },
    { computed2: 2 }
  ])

  $val.set(3)
  deepStrictEqual(events, [
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
  let $store = atom(1)
  let $deferrer = computed($store, value => value * 2)

  let events = ''
  onMount($deferrer, () => {
    events += 'init '
    return () => {
      events += 'destroy '
    }
  })
  equal(events, '')

  let deferrerValue: number | undefined
  let unbind = $deferrer.subscribe(value => {
    deferrerValue = value
  })
  equal($deferrer.get(), $store.get() * 2)
  equal(deferrerValue, $store.get() * 2)
  equal(events, 'init ')

  $store.set(3)
  equal($deferrer.get(), $store.get() * 2)
  equal(deferrerValue, $store.get() * 2)

  unbind()
  equal(events, 'init destroy ')
})

test('computes initial value when argument is undefined', () => {
  let $one = atom<string | undefined>(undefined)
  let $two = computed($one, (value: string | undefined) => !!value)
  equal($one.get(), undefined)
  equal($two.get(), false)
})

// test('batches updates when passing batch arg', () => {
//   let st1 = atom('1')
//   let st2 = atom('1')

//   let cmp = batched([st1, st2], (v1, v2) => v1 + v2)

//   let events: string = ''
//   cmp.subscribe(v => (events += v))

//   st1.set('2')
//   st2.set('2')

//   clock.runAll()

//   st1.set('3')
//   st2.set('3')

//   clock.runAll()
//   equal(events, '112233')
// })

// test('computes initial value for batch arg without waiting', () => {
//   let st1 = atom('1')
//   let st2 = atom('1')
//   let cmp = batched([st1, st2], (v1, v2) => v1 + v2)
//   equal('11', cmp.get())
// })

test('supports map', () => {
  let $map = map({
    counter: 1
  })
  let $computedMap = computed($map, value => {
    return value.counter + 1
  })

  let mapValue: { counter: number } | undefined
  let computedMapValue: number | undefined

  let unsubscribeMap = $map.subscribe(value => {
    mapValue = value
  })
  let unsubscribeComputedMap = $computedMap.subscribe(value => {
    computedMapValue = value
  })

  $map.set({
    counter: 2
  })
  deepStrictEqual(mapValue, { counter: 2 })
  equal(computedMapValue, 3)

  $map.setKey('counter', 3)
  deepStrictEqual(mapValue, { counter: 3 })
  equal(computedMapValue, 4)

  unsubscribeMap()
  unsubscribeComputedMap()
})

test('supports deepMap', () => {
  let $deepMap = deepMap({
    item: {
      nested: 1
    }
  })
  let $computedDeepMap = computed($deepMap, value => {
    return value.item.nested + 1
  })

  let deepMapValue: { item: { nested: number } } | undefined
  let computedDeepMapValue: number | undefined

  let unsubscribeDeepMap = $deepMap.subscribe(value => {
    deepMapValue = value
  })
  let unsubscribeComputedMap = $computedDeepMap.subscribe(value => {
    computedDeepMapValue = value
  })

  $deepMap.set({
    item: {
      nested: 2
    }
  })
  deepStrictEqual(deepMapValue, { item: { nested: 2 } })
  equal(computedDeepMapValue, 3)

  $deepMap.setKey('item.nested', 3)
  deepStrictEqual(deepMapValue, { item: { nested: 3 } })
  equal(computedDeepMapValue, 4)

  unsubscribeDeepMap()
  unsubscribeComputedMap()
})

test('async computed using task', async () => {
  let $a = atom(1)
  let $b = atom(2)
  let sleepCycles = 5
  let taskArgumentsCalls: number[][] = []
  let $sum = computed([$a, $b], (a, b) =>
    task(async () => {
      taskArgumentsCalls.push([a, b])
      for (let i = 0; i < sleepCycles; i++) {
        await Promise.resolve()
      }
      return a + b
    })
  )
  $sum.subscribe(() => {})
  equal($sum.get(), undefined)
  deepStrictEqual(taskArgumentsCalls, [[1, 2]])

  sleepCycles = 0
  $a.set(10)
  $b.set(20)

  // Nothing happens for 3 event loops
  for (let i = 0; i < 3; i++) {
    await Promise.resolve()
    equal($sum.get(), undefined)
    deepStrictEqual(taskArgumentsCalls, [
      [1, 2],
      [10, 2],
      [10, 20]
    ])
  }

  await allTasks()
  equal($sum.get(), 30)
  deepStrictEqual(taskArgumentsCalls, [
    [1, 2],
    [10, 2],
    [10, 20]
  ])
})

test('skips stale update', async () => {
  let $value = atom(1)
  let sleepCycles = 40
  let taskArgumentsCalls: number[] = []
  let resolvedArgumentsCalls: number[] = []

  let $delayedValue = computed([$value], value =>
    task(async () => {
      taskArgumentsCalls.push(value)
      let cycles = sleepCycles

      for (let i = 0; i < cycles; i++) {
        await Promise.resolve()
      }

      resolvedArgumentsCalls.push(value)

      return value
    })
  )

  $delayedValue.subscribe(() => {})
  equal($delayedValue.get(), undefined)
  deepStrictEqual(taskArgumentsCalls, [1])
  deepStrictEqual(resolvedArgumentsCalls, [])

  sleepCycles = 2
  $value.set(20)
  sleepCycles = 0
  $value.set(10)

  await Promise.resolve()
  equal($delayedValue.get(), undefined)
  deepStrictEqual(taskArgumentsCalls, [1, 20, 10])
  deepStrictEqual(resolvedArgumentsCalls, [10])

  // Nothing happens for 2 more event loops
  for (let i = 0; i < 2; i++) {
    await Promise.resolve()
    equal($delayedValue.get(), undefined)
    deepStrictEqual(taskArgumentsCalls, [1, 20, 10])
    deepStrictEqual(resolvedArgumentsCalls, [10, 20])
  }

  await Promise.resolve()

  equal($delayedValue.get(), 10)
  deepStrictEqual(taskArgumentsCalls, [1, 20, 10])
  deepStrictEqual(resolvedArgumentsCalls, [10, 20])

  await allTasks()
  equal($delayedValue.get(), 10)
  deepStrictEqual(taskArgumentsCalls, [1, 20, 10])
  deepStrictEqual(resolvedArgumentsCalls, [10, 20, 1])
})

test('computed values update first', () => {
  let $atom = atom(1)
  let $computed = computed($atom, value => value * 2)
  let values: (number | string)[] = []
  $atom.subscribe(value => {
    values.push(value)
    values.push($computed.get())
  })
  $computed.subscribe(() => {
    values.push('afterAtom')
  })
  deepStrictEqual(values, [1, 2, 'afterAtom'])
  $atom.set(2)
  deepStrictEqual(values, [1, 2, 'afterAtom', 2, 4, 'afterAtom'])
})

test('removes listeners from queue on unsubscribe from computed', () => {
  let $atom = atom(0)
  let $computed = computed($atom, value => value * 2)
  let values: (number | string)[] = []

  let unsubscribe = $computed.listen(() => {
    values.push('afterAtom')
  })
  $atom.listen(value => {
    values.push(value)
    values.push($computed.get())
    if (value > 1) {
      unsubscribe()
    }
  })
  $atom.set(1)
  deepStrictEqual(values, [1, 2, 'afterAtom'])
  $atom.set(2)
  deepStrictEqual(values, [1, 2, 'afterAtom', 2, 4])
})

// test('cleans up on unmount', () => {
//   let $source = atom({ count: 1 })
//   let $derived = computed($source, s => s.count)

//   equal($derived.lc, 0)
//   equal($source.lc, 0)

//   let unbind = $derived.subscribe(() => {})

//   equal($derived.lc, 1)
//   equal($source.lc, 1)

//   unbind()

//   equal($derived.lc, 0)
//   equal($source.lc, 0)
// })

test('stale computed in other computed', () => {
  let $atom = atom(1)
  let values: (number | string)[] = []
  let $computed1 = computed($atom, () => {
    values.push($computed2.get())
  })
  let $computed2 = computed($atom, value => value * 2)
  $computed1.subscribe(() => {})
  $atom.set(2)
  deepStrictEqual(values, [2, 4])
})

// test('stale computed in listener', () => {
//   let $event = atom()
//   let $atom = atom(1)
//   let $computed = computed($atom, value => value * 2)
//   $computed.listen(() => {})
//   let values: (number | string)[] = []
//   $event.listen(() => {
//     $atom.set(2)
//     values.push($computed.get())
//   })
//   $event.set('foo')
//   deepStrictEqual(values, [4])
// })

// test('stale computed via nested dependency', () => {
//   let $event = atom()
//   let $atom = atom(1)
//   let $computed1 = computed($atom, value => value * 2)
//   let $computed2 = computed($computed1, value => value * 3)
//   $computed2.listen(() => {})
//   let values: (number | string)[] = []
//   $event.listen(() => {
//     $atom.set(2)
//     values.push($computed2.get())
//   })
//   $event.set('foo')
//   deepStrictEqual(values, [12])
// })
