import { onMount } from '../lifecycle/index.js'
import { atom, notifyId } from '../atom/index.js'

export let computed = (stores, cb) => {
  if (!Array.isArray(stores)) stores = [stores]

  let diamondNotifyId
  let run = () => {
    if (diamondNotifyId !== notifyId) {
      diamondNotifyId = notifyId
      derived.set(cb(...stores.map(store => store.get())))
    }
  }
  let derived = atom()

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
