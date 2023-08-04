import { test } from 'uvu'
import { equal, throws } from 'uvu/assert'

import { atom } from '../atom/index.js'
import { createContext, resetContext } from './index.js'

test.before(() => {
  process.env.NODE_ENV = 'production'
})

test.after(() => {
  process.env.NODE_ENV = 'test'
  resetContext()
})

test.only('polluted global context throws an error', () => {
  let $atom = atom(0)

  equal($atom.get(), 0)
  createContext()

  throws(() => $atom.get(), 'no global ctx')
})

test.run()
