import { atom, taskStack } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'

export let computed = (stores, cb) => {
  let $computed = atom()
  let diamondArgs

  if (cb) {
    stores = Array.isArray(stores) ? stores : [stores]
  } else {
    cb = stores
    stores = []
  }
  let predefinedLength = stores.length
  let unbinds = []

  let run = () => {
    let args = stores.map(store => store.value)
    if (!diamondArgs || args.some((arg, i) => arg !== diamondArgs[i])) {
      let task = storeOrCb => {
        if (!storeOrCb) return $computed.value
        if (storeOrCb.get) {
          if (!~stores.indexOf(storeOrCb)) {
            stores.push(storeOrCb)
            unbinds.push(storeOrCb.listen(run, $computed))
            args.push(storeOrCb.value)
            $computed.l = Math.max($computed.l, storeOrCb.l + 1)
          }
          return storeOrCb.get()
        }
        taskStack.push(task)
        try {
          return storeOrCb()
        } finally {
          taskStack.pop()
        }
      }
      let taskValue = task(() =>
        predefinedLength
        ? cb(...args.slice(0, predefinedLength))
        : cb(task))
      let complete = newValue => {
        if (newValue !== task) {
          $computed.set(newValue)
        }
      }
      diamondArgs = args
      complete(taskValue)
    }
  }

  onMount($computed, () => {
    for (let store of stores) {
      unbinds.push(store.listen(run, $computed))
      $computed.l = Math.max($computed.l, store.l + 1)
    }
    run()
    return () => {
      for (let unbind of unbinds) unbind()
      unbinds.length = 0
    }
  })

  return $computed
}

