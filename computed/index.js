import { atom } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'
import { taskSymbol } from '../task/index.js'

let computedStore = (stores, cb, batched) => {
  if (!Array.isArray(stores)) stores = [stores]

  let previousArgs
  let set = () => {
    let args = stores.map($store => $store.get())
    if (
      previousArgs === undefined ||
      args.some((arg, i) => arg !== previousArgs[i])
    ) {
      previousArgs = args
      let newValue = cb(...args)
      if (newValue && newValue[taskSymbol]) {
        newValue.then(asyncValue => $computed.set(asyncValue))
      } else {
        $computed.set(newValue)
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
