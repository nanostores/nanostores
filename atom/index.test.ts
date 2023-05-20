import type { InstalledClock } from '@sinonjs/fake-timers'

import FakeTimers from '@sinonjs/fake-timers'
import { test } from 'uvu'
import { equal, is } from 'uvu/assert'

import { atom, onMount } from '../index.js'

let clock: InstalledClock

test.before(() => {
  clock = FakeTimers.install()
})

test.after(() => {
  clock.uninstall()
})

test('listens', () => {
  let calls = 0
  let store = atom({ some: { path: 0 } })
  let unbind = store.listen(value => {
    calls += 1
    is(value, store.get())
  })

  store.set({ some: { path: 1 } })
  store.set({ some: { path: 2 } })
  equal(store.get(), { some: { path: 2 } })
  equal(calls, 2)
  unbind()
})

test('subscribes', () => {
  let calls = 0
  let store = atom({ some: { path: 0 } })
  let unbind = store.subscribe(value => {
    calls += 1
    is(value, store.get())
  })

  store.set({ some: { path: 1 } })
  store.set({ some: { path: 2 } })
  equal(store.get(), { some: { path: 2 } })
  equal(calls, 3)
  unbind()
})

test('has default value', () => {
  let events: any[] = []
  let time = atom()
  equal(time.value, undefined)
  time.listen(() => {})
  time.listen(() => {})
  time.listen(() => {})
  let unbind = time.subscribe(value => {
    events.push(value)
  })
  time.set({ test: 2 })
  time.set({ test: 3 })
  equal(time.value, { test: 3 })
  equal(events, [undefined, { test: 2 }, { test: 3 }])
  unbind()
})

test('initializes store when it has listeners', () => {
  let events: string[] = []

  let store = atom<string | undefined>('')

  onMount(store, () => {
    store.set('initial')
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  equal(events, [])

  let unbind1 = store.listen(value => {
    events.push(`1: ${value}`)
  })
  equal(events, ['init'])

  let unbind2 = store.listen(value => {
    events.push(`2: ${value}`)
  })
  equal(events, ['init'])

  store.set('new')
  equal(events, ['init', '1: new', '2: new'])

  unbind1()
  clock.runAll()
  equal(events, ['init', '1: new', '2: new'])

  store.set('new2')
  equal(events, ['init', '1: new', '2: new', '2: new2'])

  unbind2()
  equal(events, ['init', '1: new', '2: new', '2: new2'])

  let unbind3 = store.listen(() => {})
  clock.runAll()
  equal(events, ['init', '1: new', '2: new', '2: new2'])

  unbind3()
  equal(events, ['init', '1: new', '2: new', '2: new2'])

  clock.runAll()
  equal(events, ['init', '1: new', '2: new', '2: new2', 'destroy'])
})

test('supports complicated case of last unsubscribing', () => {
  let events: string[] = []

  let store = atom<string | undefined>()

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
  let events: (string | undefined)[] = []
  function listener(value: string | undefined): void {
    events.push(value)
  }

  let store = atom<string | undefined>()

  onMount(store, () => {
    return () => {
      events.push('destroy')
    }
  })

  let unbind1 = store.listen(listener)
  let unbind2 = store.listen(listener)
  store.set('1')
  equal(events, ['1', '1'])

  unbind1()
  clock.runAll()
  store.set('2')
  equal(events, ['1', '1', '2'])

  unbind2()
  clock.runAll()
  equal(events, ['1', '1', '2', 'destroy'])
})

test('supports double unsubscribe', () => {
  let store = atom<string>('')
  let unbind = store.listen(() => {})
  store.listen(() => {})

  unbind()
  unbind()

  equal(store.lc, 1)
})

test('can subscribe to changes and call listener immediately', () => {
  let events: (string | undefined)[] = []

  let store = atom<string | undefined>()

  onMount(store, () => {
    store.set('initial')
    return () => {
      events.push('destroy')
    }
  })

  let unbind = store.subscribe(value => {
    events.push(value)
  })
  equal(events, ['initial'])

  store.set('new')
  equal(events, ['initial', 'new'])

  unbind()
  clock.runAll()
  equal(events, ['initial', 'new', 'destroy'])
})

test('supports starting store again', () => {
  let events: (string | undefined)[] = []

  let store = atom<string | undefined>()

  onMount(store, () => {
    store.set('0')
    events.push('init')
    return () => {
      events.push('destroy')
    }
  })

  let unbind = store.subscribe(value => {
    events.push(value)
  })

  store.set('1')

  unbind()
  clock.runAll()

  store.set('2')

  store.subscribe(value => {
    events.push(value)
  })
  equal(events, ['init', '0', '1', 'destroy', 'init', '0'])
})

test('works without initializer', () => {
  let events: (string | undefined)[] = []

  let store = atom<string | undefined>()

  let unbind = store.subscribe(value => {
    events.push(value)
  })
  equal(events, [undefined])

  store.set('new')
  equal(events, [undefined, 'new'])

  unbind()
  clock.runAll()
})

test('supports conditional destroy', () => {
  let events: string[] = []

  let destroyable = true
  let store = atom<string | undefined>()

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

test('does not mutate listeners while change event', () => {
  let events: string[] = []
  let store = atom<number | undefined>()

  onMount(store, () => {
    store.set(0)
  })

  store.listen(value => {
    events.push(`a${value}`)
    unbindB()
    store.listen(v => {
      events.push(`c${v}`)
    })
  })

  let unbindB = store.listen(value => {
    events.push(`b${value}`)
  })

  store.set(1)
  equal(events, ['a1', 'b1'])

  store.set(2)
  equal(events, ['a1', 'b1', 'a2', 'c2'])
})

test('prevents notifying when new value is referentially equal to old one', () => {
  let events: (string | undefined)[] = []

  let store = atom<string | undefined>('old')

  let unbind = store.subscribe(value => {
    events.push(value)
  })
  equal(events, ['old'])

  store.set('old')
  equal(events, ['old'])

  store.set('new')
  equal(events, ['old', 'new'])

  unbind()
  clock.runAll()
})

test.run()
