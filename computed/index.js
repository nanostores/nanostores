import { mount } from '../mount/index.js'
import { atom } from '../atom/index.js'

const collectWritable = deps => [
  ...new Set(
    deps.reduce(
      (acc, dep) => (dep.deps ? [...acc, ...dep.deps] : [...acc, dep]),
      []
    )
  )
]

export let computed = (stores, cb) => {
  if (!Array.isArray(stores)) stores = [stores]
  let deps = collectWritable(stores)

  let run = () => cb(...stores.map(store => store.get()))
  let derived = atom()

  mount(derived, () => {
    derived.set(run())
    let unbinds = deps.map(store =>
      store.listen(() => {
        derived.set(run())
      })
    )
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return {
    deps,
    ...derived
  }
}
