import { atom } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'

export let computed = (stores, cb) => {
  if (!Array.isArray(stores)) stores = [stores]

  let diamondArgs
  let run = () => {
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

  onMount($computed, () => {
    let unbinds = stores.map($store => $store.listen(run, $computed.l))
    run()
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return $computed
}
