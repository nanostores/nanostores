import { clearEffects } from '../effect/index.js'

export const clean = Symbol('clean')

export function cleanStores(...stores) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'cleanStores() can be used only during development or tests'
    )
  }
  clearEffects()
  for (let store of stores) {
    if (store) {
      if (store.mocked) delete store.mocked
      store[clean]()
    }
  }
}
