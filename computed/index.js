import { atom, NANOSTORES_EPOCH } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'
import { warn } from '../warn/index.js'

let computedStore = (stores, cb, batched) => {
  if (!Array.isArray(stores)) stores = [stores]

  let previousArgs
  let currentEpoch
  let set = () => {
    if (currentEpoch === NANOSTORES_EPOCH.epoch) return
    currentEpoch = NANOSTORES_EPOCH.epoch
    let args = stores.map($store => $store.get())
    if (!previousArgs || args.some((arg, i) => arg !== previousArgs[i])) {
      previousArgs = args
      let value = cb(...args)
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
        currentEpoch = NANOSTORES_EPOCH.epoch
      }
    }
  }
  let $computed = atom(undefined)
  let get = $computed.get
  $computed.get = () => {
    set()
    return get()
  }

  let timer
  let run = batched
    ? () => {
        clearTimeout(timer)
        timer = setTimeout(set)
      }
    : set

  onMount($computed, () => {
    let unbinds = stores.map($store => $store.listen(run))
    set()
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return $computed
}

/* @__NO_SIDE_EFFECTS__ */
export const computed = (stores, fn) => computedStore(stores, fn)

/* @__NO_SIDE_EFFECTS__ */
export const batched = (stores, fn) => computedStore(stores, fn, true)
