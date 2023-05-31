import { atom, autosubscribeStack } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'

export let computed = (stores, cb) => {
  let derived = atom()
  let diamondArgs

  if (cb) {
    stores = Array.isArray(stores) ? stores : [stores]
  } else {
    cb = stores
    stores = []
  }
  let predefinedLength = stores.length
  let currentCbId = 0
  let unbinds = []
  let privateStoreIndexPlus1List = []
  let autosubscribeOnCbs = []
  let autosubscribeOffCbs = []
  let undoValue // derived.value is undefined

  let run = () => {
    let args = stores.map(store => store.value)
    if (!diamondArgs || args.some((arg, i) => arg !== diamondArgs[i])) {
      let cbId = ++currentCbId
      let stale = () => cbId !== currentCbId
      let use = storeOrCb => {
        if (!storeOrCb) return derived.value
        if (storeOrCb.get) {
          if (!~stores.indexOf(storeOrCb)) {
            stores.push(storeOrCb)
            unbinds.push(storeOrCb.listen(run, derived))
            args.push(storeOrCb.value)
            derived.l = Math.max(derived.l, storeOrCb.l + 1)
            if (use === storeOrCb.a) {
              privateStoreIndexPlus1List.push(stores.length)
            }
          }
          return storeOrCb.get()
        }
        autosubscribeStack.push(use)
        try {
          return storeOrCb()
        } finally {
          autosubscribeStack.pop()
        }
      }
      use.onStart = onCb => {
        if (!stale()) {
          autosubscribeOnCbs.push(onCb)
          onCb()
        }
        return use
      }
      use.onStop = offCb => {
        if (!stale()) {
          autosubscribeOffCbs.push(offCb)
        }
        return use
      }
      use.set = newValue => {
        if (!stale()) {
          derived.set(newValue)
        }
        return use
      }
      use.save = newValue => {
        if (!stale()) {
          derived.set(undoValue = newValue)
        }
        return use
      }
      use.stale = stale
      use.undo = () => use.set(undoValue)
      // eslint-disable-next-line no-cond-assign
      for (let len; len = privateStoreIndexPlus1List.pop();) {
        stores.splice(len - 1, 1)
        unbinds.splice(len - 1, 1)[0]()
      }
      for (let offCb of autosubscribeOffCbs) offCb()
      autosubscribeOffCbs.length = autosubscribeOnCbs.length = 0
      let autosubscribeValue = use(() =>
        predefinedLength
        ? cb(...args.slice(0, predefinedLength))
        : cb(use))
      let complete = newValue => {
        if (stale()) return
        if (newValue === use) {
          undoValue = derived.value
        } else {
          derived.set(undoValue = newValue)
        }
      }
      diamondArgs = args
      if (autosubscribeValue && autosubscribeValue.then) {
        autosubscribeValue.then(complete)
      } else {
        complete(autosubscribeValue)
      }
    }
  }

  onMount(derived, () => {
    for (let store of stores) {
      unbinds.push(store.listen(run, derived))
      derived.l = Math.max(derived.l, store.l + 1)
    }
    for (let onCb of autosubscribeOnCbs) onCb()
    run()
    return () => {
      for (let unbind of unbinds) unbind()
      for (let offCb of autosubscribeOffCbs) offCb()
      unbinds.length = 0
    }
  })

  return derived
}

