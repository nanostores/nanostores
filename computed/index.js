import { onMount } from '../lifecycle/index.js'
import { atom, notifyId } from '../atom/index.js'

export let computed = (stores, cb) => {
  if (!Array.isArray(stores)) stores = [stores]

  let diamondNotifyId
  let diamondArgs = []
  let derived = atom()
  let run = () => {
    let args = stores.map(store => store.get())
    if (
      diamondNotifyId !== notifyId ||
      args.some((arg, i) => arg !== diamondArgs[i])
    ) {
      diamondNotifyId = notifyId
      diamondArgs = args
      derived.set(cb(...args))
      return derived.notify;
    }
  }

  derived.set = (data) => {
    derived.value = data
  };

  onMount(derived, () => {
    let unbinds = stores.map(store =>
      store.listen(run, cb)
    )
    run()
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return derived
}
