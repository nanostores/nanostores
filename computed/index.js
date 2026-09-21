import { atom, nanostoresGlobal } from '../atom/index.js'
import { clean } from '../clean-stores/index.js'
import { changed, runUntilCurrent } from '../track/index.js'
import { warn } from '../warn/index.js'

let computedStore = (stores, cb, batched) => {
  if (!Array.isArray(stores)) stores = [stores]

  let deps = { stores }
  let currentEpoch
  let updating
  let called
  let value

  let runIfChanged = () => {
    if (deps.values && !changed(deps)) return
    called = true
    // Save values only after the call to repeat it after an error
    let values = stores.map($store => $store.get())
    value = cb(...values)
    deps.values = values
    return true
  }

  let set = () => {
    // Callback can change own dependency. runUntilCurrent() will see it.
    if (updating || currentEpoch === nanostoresGlobal.epoch) return
    updating = true
    called = false
    try {
      runUntilCurrent(deps, runIfChanged)
    } finally {
      updating = false
    }
    currentEpoch = nanostoresGlobal.epoch
    if (!called) return
    if (value && value.then && value.t) {
      if (process.env.NODE_ENV !== 'production') {
        warn(
          'Use @nanostores/async for async computed. We will remove Promise support in computed() in Nano Stores 2.0'
        )
      }
      let values = deps.values
      value.then(asyncValue => {
        if (deps.values === values) {
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
      deps.values = undefined
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
