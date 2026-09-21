import { atom, nanostoresGlobal } from '../atom/index.js'
import { clean } from '../clean-stores/index.js'
import { warn } from '../warn/index.js'

// Callback, which changes own store on every run, would hang the process
const RUNS_LIMIT = 100

let computedStore = (stores, cb, batched) => {
  if (!Array.isArray(stores)) stores = [stores]

  let previousArgs
  let currentEpoch
  let updating

  let changed = () =>
    stores.some(($store, i) => !$store.eq(previousArgs[i], $store.get()))

  let set = () => {
    // Callback can change own store. The loop below will see it.
    if (updating || currentEpoch === nanostoresGlobal.epoch) return
    updating = true
    let runs = 0
    let startEpoch
    let args
    let value
    try {
      // Reading a store can mount it, which can change a store read before,
      // also a store behind a computed store. Repeat until values are current.
      do {
        startEpoch = nanostoresGlobal.epoch
        if (!previousArgs || changed()) {
          if (runs++ > RUNS_LIMIT) {
            throw new Error('Callback changes own dependencies on every run')
          }
          // Save values only after the call to repeat it after an error
          args = stores.map($store => $store.get())
          value = cb(...args)
          previousArgs = args
        }
      } while (startEpoch !== nanostoresGlobal.epoch && changed())
    } finally {
      updating = false
    }
    currentEpoch = nanostoresGlobal.epoch
    if (!args) return
    if (value && value.then && value.t) {
      if (process.env.NODE_ENV !== 'production') {
        warn(
          'Use @nanostores/async for async computed. We will remove Promise support in computed() in Nano Stores 2.0'
        )
      }
      value.then(asyncValue => {
        if (previousArgs === args) {
          // Prevent a stale set
          $computed.set(asyncValue)
        }
      })
    } else {
      $computed.set(value)
      currentEpoch = nanostoresGlobal.epoch
    }
  }
  let $computed = atom()
  $computed.get = () => {
    set()
    return $computed.value
  }

  if (process.env.NODE_ENV !== 'production') {
    let cleanComputed = $computed[clean]
    $computed[clean] = () => {
      previousArgs = undefined
      currentEpoch = undefined
      $computed.value = undefined
      cleanComputed()
    }
  }

  let timer
  let run = batched
    ? () => {
        clearTimeout(timer)
        timer = setTimeout(set)
      }
    : set

  let unbinds = []
  let listen = $computed.listen
  $computed.listen = listener => {
    if (!$computed.lc) {
      // Callback can throw, so listen to stores only after it
      set()
      unbinds = stores.map($store => $store.listen(run))
    }
    return listen(listener)
  }
  // Store without listeners does not listen to its stores, so a store, which
  // nobody needs, does not call the callback. get() updates it on demand.
  $computed.off = () => {
    clearTimeout(timer)
    for (let unbind of unbinds) unbind()
  }

  return $computed
}

/* @__NO_SIDE_EFFECTS__ */
export const computed = (stores, fn) => computedStore(stores, fn)

/* @__NO_SIDE_EFFECTS__ */
export const batched = (stores, fn) => computedStore(stores, fn, true)
