import { atom } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'
import { task } from '../task/index.js'

/* @__NO_SIDE_EFFECTS__ */
let computedAsyncStore = (stores, cb, cascade) => {
  if (!Array.isArray(stores)) stores = [stores]

  let $computed = atom({ state: 'loading' })

  let lastArgs
  let load = () => {
    let args = stores.map($store => $store.get())
    if (!lastArgs || args.some((arg, i) => arg !== lastArgs[i])) {
      lastArgs = args
      let current = $computed.get()
      if (current.state !== 'loading' && !current.changing) {
        // If the state is already 'loading' or 'changing', leave it as is
        // so it doesn't trigger downstream updates unnecessarily.
        $computed.set({ ...current, changing: true })
      }
      let inputs = args
      if (cascade) {
        // Cascading mutates the array in place
        inputs = [...args]
        for (let i = 0; i < inputs.length; i++) {
          if (inputs[i]?.state === 'loading' || inputs[i]?.changing) {
            // Do not start loading if any of the input stores are async and
            // currently loading or changing. This prevents recomputing async values
            // in intermediary states.
            return
          }
          if (inputs[i]?.state === 'failed') {
            // Propagate failure if any of the input stores are async and currently failed.
            $computed.set({
              changing: false,
              error: inputs[i].error,
              state: 'failed'
            })
            return
          }
          if (inputs[i]?.state === 'loaded') {
            inputs[i] = inputs[i].value
          }
        }
      }
      // Ensures async so synchronous throws become async rejections
      task(() =>
        Promise.resolve()
          .then(() => {
            if (lastArgs === args) {
              // Prevent a stale call
              return cb(...inputs)
            }
          })
          .then(
            value => {
              if (lastArgs === args) {
                // Prevent a stale set
                $computed.set({
                  changing: false,
                  state: 'loaded',
                  value
                })
              }
            },
            error => {
              if (lastArgs === args) {
                // Prevent a stale set
                $computed.set({
                  changing: false,
                  error,
                  state: 'failed'
                })
              }
            }
          )
      )
    }
  }

  onMount($computed, () => {
    let unbinds = stores.map($store => $store.listen(load))
    load()
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return $computed
}

/* @__NO_SIDE_EFFECTS__ */
export const computedAsync = (stores, fn) =>
  computedAsyncStore(stores, fn, true)

/* @__NO_SIDE_EFFECTS__ */
export const computedAsyncNoCascade = (stores, fn) =>
  computedAsyncStore(stores, fn, false)
