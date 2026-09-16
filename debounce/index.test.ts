import FakeTimers from '@sinonjs/fake-timers'
import { equal } from 'node:assert'
import { test } from 'node:test'

import { timeoutDebounce } from './index.js'
import { atom } from '../atom/index.js'

let clock = FakeTimers.install()

test('debounces on call', () => {
  let inAtom = atom(1)
  let debouncedAtom = timeoutDebounce(inAtom, 0)

  inAtom.set(2)
  inAtom.set(3)

  clock.runAll()
  equal(debouncedAtom.get(), 3)
})
