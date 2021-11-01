import FakeTimers from '@sinonjs/fake-timers'
import { equal, is } from 'uvu/assert'
import { test } from 'uvu'

import { mapTemplate } from '../index.js'

let clock = FakeTimers.install()

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

test.run()
