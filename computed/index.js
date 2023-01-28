import { onMount } from '../lifecycle/index.js'
import { atom, notifyId } from '../atom/index.js'

let callStack = [];

export let computed = (stores, cb) => {
  if (!Array.isArray(stores)) stores = [stores]

  let diamondNotifyId
  let diamondArgs = []
  let run = () => {
    let args = stores.map(store => store.get())
    if (
      diamondNotifyId !== notifyId ||
      args.some((arg, i) => arg !== diamondArgs[i])
    ) {
      diamondNotifyId = notifyId
      diamondArgs = args
      derived.set(cb(...args))
    }
  }
  let derived = atom()

  onMount(derived, () => {
    let callCount = 0;
    let unbinds
    if (stores.length > 1) {
      unbinds = stores.map(store =>
        store.listen(() => {
          callCount++
          setTimeout(() => {
            if (callCount > 0) {
              callCount = 0;
              run()
            }
          }, 0)
        })
      )
    } else {
      unbinds = stores.map(store =>
        store.listen(run)
      )
    }
    run()
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return derived
}
