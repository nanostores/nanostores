import { prepareForTest } from '../prepare-for-test/index.js'

export const clean = Symbol('clean')

export function cleanStores (...stores) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'cleanStores() can be used only during development or tests'
    )
  }
  delete prepareForTest.mocked
  for (let store of stores) {
    store[clean]()
  }
}
