import { getValue } from '../get-value/index.js'
import { atom } from '../atom/index.js'

const collectWritable = deps => [
  ...new Set(
    deps.reduce(
      (acc, dep) => (dep.deps ? [...acc, ...dep.deps] : [...acc, dep]),
      []
    )
  )
]

export function computed(stores, cb) {
  if (!Array.isArray(stores)) stores = [stores]
  let deps = collectWritable(stores)

  let run = () => cb(...stores.map(store => getValue(store)))

  let derived = atom(() => {
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
