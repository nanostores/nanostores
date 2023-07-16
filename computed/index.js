import { atom } from '../atom/index.js'
import { autosubscribeStack } from '../autosubscribe/index.js'
import { onMount } from '../lifecycle/index.js'
export let computed = (storesOrCb, cb) => {
  let $computed = atom()
  let previousArgs
  let stores

  if (cb) {
    stores = Array.isArray(storesOrCb) ? storesOrCb : [storesOrCb]
  } else {
    cb = storesOrCb
    stores = []
  }
  let predefinedStoresLength = stores.length
  let unbinds = []

  let run = () => {
    let args = stores.map($store => $store.value)
    if (!previousArgs || args.some((arg, i) => arg !== previousArgs[i])) {
      autosubscribeStack.push($store => {
        if (!~stores.indexOf($store)) {
          stores.push($store)
          args.push($store.value)
          unbinds.push($store.listen(run, $computed))
          $computed.l = Math.max($computed.l, $store.l + 1)
        }
        return $store.get()
      })
      try {
        $computed.set(cb(...args.slice(0, predefinedStoresLength)))
      } finally {
        autosubscribeStack.pop()
      }
      previousArgs = args
    }
  }

  onMount($computed, () => {
    for (let $store of stores) {
      unbinds.push($store.listen(run, $computed))
      $computed.l = Math.max($computed.l, $store.l + 1)
    }
    run()
    return () => {
      for (let unbind of unbinds) unbind()
      unbinds.length = 0
    }
  })

  return $computed
}
