import { Signal, WritableSignal } from '../spred.js'

import { clean } from '../clean-stores/index.js'

Signal.prototype.listen = function (callback) {
  return this.subscribe(callback, false)
}

export let epoch = 0

export const withClean = $store => {
  if (process.env.NODE_ENV !== 'production') {
    let originalSubscribe = $store.subscribe
    let unsubs = []

    $store.subscribe = function (subscriber, immediate) {
      let unsubscribe = originalSubscribe.call($store, subscriber, immediate)
      unsubs.push(unsubscribe)
      return unsubscribe
    }

    $store[clean] = () => {
      for (let unsubscribe of unsubs) unsubscribe()
      unsubs = []
    }
  }

  return $store
}

/* @__NO_SIDE_EFFECTS__ */
export const atom = initialValue => {
  return withClean(new WritableSignal(initialValue))
}

export const readonlyType = store => store
