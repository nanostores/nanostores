import { atom, autosubscribeStack } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'

let computedStore = (stores, cb, batched) => {
  if (cb) {
    stores = Array.isArray(stores) ? stores : [stores]
  } else {
    cb = stores
    stores = []
  }

  let previousArgs
  let predefinedLength = stores.length
  let unbinds = []
  let currentRunId = 0
  let set = () => {
    let args = stores.map($store => $store.get())
    if (
      previousArgs === undefined ||
      args.some((arg, i) => arg !== previousArgs[i])
    ) {
      let runId = ++currentRunId
      previousArgs = args
      let use = $atom => {
        if (!~stores.indexOf($atom)) {
          stores.push($atom)
          unbinds.push($atom.listen(run, $computed))
          args.push($atom.value)
          $computed.l = Math.max($computed.l, $atom.l + 1)
        }
        return $atom.get()
      }
      try {
        autosubscribeStack.push(use)
        let value = cb(...args.slice(0, predefinedLength))
        if (value && value.then && value.t) {
          value.then(asyncValue => {
            if (runId === currentRunId) { // Prevent a stale set
              $computed.set(asyncValue)
            }
          })
        } else {
          $computed.set(value)
        }
      } finally {
        autosubscribeStack.pop()
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
    for (let store of stores) {
      unbinds.push(store.listen(run, $computed))
      $computed.l = Math.max($computed.l, store.l + 1)
    }
    set()
    return () => {
      for (let unbind of unbinds) unbind()
      unbinds.length = 0
    }
  })

  return $computed
}

export let computed = (stores, fn) => computedStore(stores, fn)
export let batched = (stores, fn) => computedStore(stores, fn, true)
