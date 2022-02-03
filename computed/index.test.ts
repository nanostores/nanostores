import FakeTimers, { InstalledClock } from '@sinonjs/fake-timers'
import { equal, ok } from 'uvu/assert'
import { test } from 'uvu'

import { StoreValue, computed, onMount, atom } from '../index.js'

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

test('prevents diamond dependency problem', () => {
  let store = atom<number>(0)
  let values: string[] = []

  let a = computed(store, count => `a${count}`)
  let b = computed(store, count => `b${count}`)
  let combined = computed([a, b], (first, second) => `${first}${second}`)

  let unsubscribe = combined.subscribe(v => {
    values.push(v)
  })

  equal(values, ['a0b0'])

  store.set(1)
  equal(values, ['a0b0', 'a1b1'])

  unsubscribe()
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
