import FakeTimers, { InstalledClock } from '@sinonjs/fake-timers'
import { equal, ok } from 'uvu/assert'
import { test } from 'uvu'

import { StoreValue, computed, onMount, atom, STORE_UNMOUNT_DELAY } from '../index.js'

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
  clock.runAll()
  equal(value, 'b 0')
  equal(renders, 2)

  number.set({ number: 1 })
  clock.runAll()
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
  clock.runAll()
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
  clock.runAll()
  equal(values, ['a0b0', 'a1b1'])

  unsubscribe()
})

test('prevents extra calls in a diamond', () => {
  const main = atom(0)
  const comp_a = computed(main, (v) => v)
  const comp_b = computed(comp_a, (v) => v)
  const last = computed([comp_a, comp_b], (a, b) => `${a} ${b}`)
  const events = []
  last.subscribe((v) => {
    events.push('LAST ' + v);
  });
  main.set(1)
  clock.runAll()

  equal(events, [
    'LAST 0 0',
    'LAST 1 1',
  ])

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
  let values:string[] = []
  let unsubscribe = b.subscribe($b => values.push($b))
  equal(values, ['0ab'])

  clock.tick(STORE_UNMOUNT_DELAY * 2)
  equal(a.get(), '0a')
  base.set(1)
  clock.runAll()
  equal(values, ['0ab', '1ab'])

  unsubscribe()
})

test('notifies when stores change within the same notifyId', () => {
  let val$ = atom(1)

  let computed1$ = computed(val$, (val) => {
    return val
  })

  let computed2$ = computed(computed1$, (computed1) => {
    return computed1
  })

  let events:any[] = []
  val$.subscribe((val) => events.push({ val }))
  computed2$.subscribe((computed2) => {
    events.push({ computed2 })
    if (computed2 % 2 === 1) {
      val$.set(val$.get() + 1)
    }
  })

  //equal(events, [{ val: 1 }, { computed2: 1 }, { val: 2 }, { computed2: 2 }])

  val$.set(3)
  clock.runAll()
  equal(events, [
    { val: 1 }, { computed2: 1 }, { val: 2 }, { computed2: 2 },
    { val: 3 }, { computed2: 3 }, { val: 4 }, { computed2: 4 }
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
  clock.runAll()
  equal(deferrer.get(), store.get() * 2)
  equal(deferrerValue, store.get() * 2)

  unbind()
  clock.runAll()
  equal(deferrer.lc, 0)
  equal(events, 'init destroy ')
})

test.run()
