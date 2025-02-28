import { strictEqual } from 'node:assert'
import type { Mock, TestContext } from 'node:test'
import { test } from 'node:test'

import type { WritableAtom } from '../atom/index.js'
import { atom } from '../atom/index.js'
import { effect } from './index.js'

function createTestData(ctx: TestContext): {
  $atom1: WritableAtom<number>
  $atom2: WritableAtom<number>
  $atom3: WritableAtom<number>
  atomsSumRef: { current: number }
  effectCleanupMock: Mock<VoidFunction>
  runsRef: { current: number }
  unbind: VoidFunction
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
  ): VoidFunction {
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
