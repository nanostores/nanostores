import { atom } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'

let computedStore = (stores, cb, batched) => {
  if (!Array.isArray(stores)) stores = [stores]

  let previousArgs
  let currentRunId = 0
  let set = () => {
    let args = stores.map($store => $store.get())
    if (
      previousArgs === undefined ||
      args.some((arg, i) => arg !== previousArgs[i])
    ) {
      let runId = ++currentRunId
      previousArgs = args
      let value = cb(...args)
      if (value && value.then && value.t) {
        value.then(asyncValue => {
          if (runId === currentRunId) {
            // Prevent a stale set
            $computed.set(asyncValue)
          }
        })
      } else {
        $computed.set(value)
      }
    }
  }
  let $computed = atom(undefined, Math.max(...stores.map($s => $s.l)) + 1)

  let timer
  let run = batched
    ? () => {
        clearTimeout(timer)
        timer = setTimeout(set)
      }
    : set

  onMount($computed, () => {
    let unbinds = stores.map($store => $store.listen(run, -1 / $computed.l))
    set()
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return $computed
}

export let computed = (stores, fn) => computedStore(stores, fn)
export let batched = (stores, fn) => computedStore(stores, fn, true)
