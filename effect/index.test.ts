import { deepStrictEqual, strictEqual, throws } from 'node:assert'
import type { Mock, TestContext } from 'node:test'
import { test } from 'node:test'

import type { WritableAtom } from '../atom/index.js'
import { atom, batch } from '../atom/index.js'
import { computed } from '../computed/index.js'
import { effect } from './index.js'

function createTestData(ctx: TestContext): {
  $atom1: WritableAtom<number>
  $atom2: WritableAtom<number>
  $atom3: WritableAtom<number>
  atomsSumRef: { current: number }
  effectCleanupMock: Mock<() => void>
  runsRef: { current: number }
  unbind: () => void
} {
  let runsRef = { current: 0 }
  let atomsSumRef = { current: 0 }

  let $atom1 = atom(1)
  let $atom2 = atom(2)
  let $atom3 = atom(3)
  let effectCleanupMock = ctx.mock.fn()

  function effectFn(
    value1: number,
    value2: number,
    value3: number
  ): () => void {
    runsRef.current += 1
    atomsSumRef.current = value1 + value2 + value3

    return effectCleanupMock
  }

  let unbind = effect([$atom1, $atom2, $atom3], effectFn)

  return {
    $atom1,
    $atom2,
    $atom3,
    atomsSumRef,
    effectCleanupMock,
    runsRef,
    unbind
  }
}

test('Runs effect on the initial call with the proper atom values', ctx => {
  let { atomsSumRef, runsRef } = createTestData(ctx)

  strictEqual(runsRef.current, 1)
  strictEqual(atomsSumRef.current, 6)
})

test('Updates value on any atom change', ctx => {
  let { $atom1, $atom2, $atom3, atomsSumRef, runsRef } = createTestData(ctx)

  $atom1.set(5)
  strictEqual(runsRef.current, 2)
  strictEqual(atomsSumRef.current, 10)
  $atom2.set(10)
  strictEqual(runsRef.current, 3)
  strictEqual(atomsSumRef.current, 18)
  $atom3.set(15)
  strictEqual(runsRef.current, 4)
  strictEqual(atomsSumRef.current, 30)
})

test('Calls cleanup function before each run', ctx => {
  let { $atom1, effectCleanupMock } = createTestData(ctx)

  $atom1.set(10)
  strictEqual(effectCleanupMock.mock.calls.length, 1)
  $atom1.set(20)
  strictEqual(effectCleanupMock.mock.calls.length, 2)
})

test('Stops running effect when returned unsubscribe method called. Runs effect cleanup as well', ctx => {
  let { $atom1, effectCleanupMock, unbind } = createTestData(ctx)

  unbind()
  strictEqual(effectCleanupMock.mock.calls.length, 1)
  $atom1.set(30)
  strictEqual(effectCleanupMock.mock.calls.length, 1)
})

test('Supports listenable sources', () => {
  let value = 1
  let listeners = new Set<() => void>()
  let $source = {
    get: () => value,
    listen(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
  let values: number[] = []

  let unbind = effect($source, current => {
    values.push(current)
  })
  value = 2
  for (let listener of listeners) listener()

  deepStrictEqual(values, [1, 2])
  unbind()
  strictEqual(listeners.size, 0)
})

test('Unsubscribes when the initial callback throws', ctx => {
  let first = atom(0)
  let second = atom(0)
  let error = new Error('initial effect failed')
  let callback = ctx.mock.fn(() => {
    throw error
  })
  let keepFirst = first.listen(() => {})

  throws(() => effect([first, second], callback), thrown => thrown === error)
  strictEqual(first.lc, 1)
  strictEqual(second.lc, 0)
  first.set(1)
  second.set(1)
  strictEqual(callback.mock.calls.length, 1)
  keepFirst()
})

test('Unsubscribes earlier sources when a later subscription throws', ctx => {
  let first = atom(0)
  let error = new Error('subscription failed')
  let second = {
    get: () => 0,
    listen(): never {
      throw error
    }
  }
  let callback = ctx.mock.fn()

  throws(() => effect([first, second], callback), thrown => thrown === error)
  strictEqual(first.lc, 0)
  first.set(1)
  strictEqual(callback.mock.calls.length, 0)
})

test('Runs once in diamond and once per batch', () => {
  let $a = atom(1)
  let $b = computed($a, a => a * 10)
  let $c = computed($a, a => a * 100)
  let log: number[] = []
  let stop = effect([$b, $c], (b, c) => {
    log.push(b + c)
  })
  $a.set(2)
  batch(() => {
    $a.set(3)
    $a.set(4)
  })
  deepStrictEqual(log, [110, 220, 440])
  stop()
})

test('Does not run when stores have the same values', () => {
  let $list = atom<number[]>([])
  let runs = 0
  let stop = effect($list, () => {
    runs += 1
  })
  $list.get().push(1)
  $list.notify()
  strictEqual(runs, 1)
  stop()
})

test('Runs again after an error without a store change', () => {
  let $a = atom(0)
  let calls = 0
  let stop = effect($a, a => {
    calls += 1
    if (a === 1) throw new Error('test')
  })
  throws(() => {
    $a.set(1)
  }, /test/)
  throws(() => {
    $a.notify()
  }, /test/)
  strictEqual(calls, 3)
  $a.set(2)
  strictEqual(calls, 4)
  stop()
  strictEqual($a.lc, 0)
})
