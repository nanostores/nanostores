import { onMount } from '../lifecycle/index.js'
import { atom, notifyId } from '../atom/index.js'

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
  let sortedStores = stores.slice().sort((a, b) => b.level - a.level)
  let derived = atom(undefined, sortedStores[0].level + 1)

  onMount(derived, () => {
    let unbinds = sortedStores.map(store => store.listen(run, cb))
    run()
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return derived
}
