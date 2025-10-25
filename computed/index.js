import { Signal, WritableSignal } from '../spred.js'

import { withClean } from '../atom/index.js'
import { task } from '../task/index.js'

/* @__NO_SIDE_EFFECTS__ */
export const computed = (stores, fn) => {
  let lastAsyncValue = {}
  let $asyncValue = new WritableSignal(lastAsyncValue)

  let isAsync = false
  let idCounter = 0

  return withClean(
    new Signal(get => {
      if (!Array.isArray(stores)) stores = [stores]

      let args = stores.map(get)
      let asyncValue = get($asyncValue)
      let asyncValueIsSame = asyncValue === lastAsyncValue
      let value

      lastAsyncValue = asyncValue

      if (!isAsync || asyncValueIsSame) value = fn(...args)

      if (value && value.then && value.t) {
        let id = ++idCounter
        isAsync = true

        task(() =>
          value.then(v => {
            if (id === idCounter) {
              // Prevent a stale set
              $asyncValue.set({ value: v })
            }
          })
        )
      }

      return isAsync ? asyncValue.value : value
    })
  )
}

/* @__NO_SIDE_EFFECTS__ */
export const batched = computed
