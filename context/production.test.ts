import { test } from 'uvu'
import { equal, throws } from 'uvu/assert'

import { atom } from '../atom/index.js'
import {
  createContext,
  createLocalContext,
  globalContext,
  resetContext,
  withContext
} from './index.js'

test.before.each(() => {
  process.env.NODE_ENV = 'production'
})

test.after.each(() => {
  process.env.NODE_ENV = 'test'
  resetContext()
})

test('traversing incorrect tree leads to error', () => {
  let ctx1 = createContext()
  let $custom = atom(1)
  withContext($custom, ctx1)

  let localCtx = createLocalContext(globalContext, 'local1')
  throws(() => withContext($custom, localCtx), /Incorrect atom tree/)
})

test(`Incorrect atom tree`, () => {
  let $atom = atom(0)
  let ctx = createContext()
  let localCtx = createLocalContext(ctx, 'local')

  withContext($atom, localCtx)

  throws(() => withContext($atom, ctx), /Incorrect atom tree/)
})

test(`Incorrect atom tree #2`, () => {
  let $global = atom(0)

  let ctx1 = createContext()
  let localCtx1 = createLocalContext(ctx1, 'local1')
  let localGlobalCtx1 = createLocalContext(globalContext, 'local-global-1')

  equal($global.get(), 0)

  equal(withContext($global, localGlobalCtx1).get(), 0)
  throws(() => withContext($global, localCtx1), /Incorrect atom tree/)
})

test.run()
