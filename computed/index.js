import { atom } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'

let computedStore = (stores, cb, batched) => {
  if (!Array.isArray(stores)) stores = [stores]

  let diamondArgs
  let set = () => {
    let args = stores.map($store => $store.get())
    if (
      diamondArgs === undefined ||
      args.some((arg, i) => arg !== diamondArgs[i])
    ) {
      diamondArgs = args
      $computed.set(cb(...args))
    }
  }

  let $computed = atom(undefined, Math.max(...stores.map(s => s.l)) + 1)

  let timer
  let run = batched
    ? () => {
        clearTimeout(timer)
        timer = setTimeout(set)
      }
    : set

  onMount($computed, () => {
    let unbinds = stores.map($store => $store.listen(run, $computed.l))
    set()
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return $computed
}

export let computed = (stores, fn) => computedStore(stores, fn)
export let batched = (stores, fn) => computedStore(stores, fn, true)
