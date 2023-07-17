import { atom } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'

export let computed = (stores, cb, batched) => {
  if (!Array.isArray(stores)) stores = [stores]

  let diamondArgs
  let set = () => {
    let args = stores.map(store => store.get())
    if (
      diamondArgs === undefined ||
      args.some((arg, i) => arg !== diamondArgs[i])
    ) {
      diamondArgs = args
      derived.set(cb(...args))
    }
  }
  let timer
  let run = batched
    ? () => {
        clearTimeout(timer)
        timer = setTimeout(set)
      }
    : set

  let derived = atom(undefined, Math.max(...stores.map(s => s.l)) + 1)

  onMount(derived, () => {
    let unbinds = stores.map(store => store.listen(run, derived.l))
    set()
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return derived
}
