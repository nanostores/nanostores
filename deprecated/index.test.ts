import FakeTimers, { InstalledClock } from '@sinonjs/fake-timers'
import { equal, is } from 'uvu/assert'
import { test } from 'uvu'

import {
  mapTemplate,
  lastAction,
  actionFor,
  onNotify,
  onBuild
} from '../index.js'

let clock: InstalledClock

test.before(() => {
  clock = FakeTimers.install()
})

test.after(() => {
  clock.uninstall()
})

test('creates store with ID and cache it', () => {
  let events: string[] = []
  let Test = mapTemplate<{ name: string }, [string, string]>(
    (store, id, a, b) => {
      store.setKey('name', 'initial')
      events.push(`init ${id} ${a} ${b}`)
      return () => {
        events.push(`destroy ${id}`)
      }
    }
  )

  let test1a = Test('1', 'a', 'A')
  let unbind1a = test1a.subscribe((value, key) => {
    events.push(`${value.id}a: ${value.name} changed ${key}`)
  })

  let test1b = Test('1', 'b', 'B')
  let unbind1b = test1b.subscribe((value, key) => {
    events.push(`${value.id}b: ${value.name} changed ${key}`)
  })

  let test2 = Test('2', 'c', 'C')
  let unbind2 = test2.listen(() => {})

  is(test1a, test1b)
  is.not(test1a, test2)

  test1a.setKey('name', 'new')
  equal(events, [
    'init 1 a A',
    '1a: initial changed undefined',
    '1b: initial changed undefined',
    'init 2 c C',
    '1a: new changed name',
    '1b: new changed name'
  ])

  unbind1a()
  unbind2()
  clock.runAll()
  equal(events, [
    'init 1 a A',
    '1a: initial changed undefined',
    '1b: initial changed undefined',
    'init 2 c C',
    '1a: new changed name',
    '1b: new changed name',
    'destroy 2'
  ])

  unbind1b()
  clock.runAll()
  equal(events, [
    'init 1 a A',
    '1a: initial changed undefined',
    '1b: initial changed undefined',
    'init 2 c C',
    '1a: new changed name',
    '1b: new changed name',
    'destroy 2',
    'destroy 1'
  ])

  let test1d = Test('1', 'd', 'd')
  test1d.subscribe((value, key) => {
    events.push(`${value.id}d: ${value.name} changed ${key}`)
  })
  equal(events, [
    'init 1 a A',
    '1a: initial changed undefined',
    '1b: initial changed undefined',
    'init 2 c C',
    '1a: new changed name',
    '1b: new changed name',
    'destroy 2',
    'destroy 1',
    'init 1 d d',
    '1d: initial changed undefined'
  ])
})

test('has onBuild listener', () => {
  let events: string[] = []
  let Template = mapTemplate<{ value: number }>(store => {
    store.setKey('value', 0)
  })

  let unbind = onBuild(Template, ({ store }) => {
    events.push(`build ${store.get().id}`)
  })

  Template('1')
  equal(events, ['build 1'])

  Template('1')
  equal(events, ['build 1'])

  Template('2')
  equal(events, ['build 1', 'build 2'])

  unbind()
  Template('3')
  equal(events, ['build 1', 'build 2'])
})

test('has actions support map templates', () => {
  let Counter = mapTemplate<{ value: number }>(store => {
    store.setKey('value', 0)
  })

  let add = actionFor(Counter, 'add', (store, number: number = 1) => {
    store.setKey('value', store.get().value + number)
  })

  let events: (string | undefined)[] = []
  let store = Counter('id')
  store.listen(() => {})
  onNotify(store, () => {
    events.push(store[lastAction])
  })

  add(store)
  add(store, 2)
  equal(events, ['add', 'add'])
  equal(store.get(), { id: 'id', value: 3 })
})

test.run()
