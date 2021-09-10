import { getValue } from '../get-value/index.js'
import { createStore } from '../create-store/index.js'

const collectWritable = deps => [
  ...new Set(
    deps.reduce(
      (acc, dep) => (dep.deps ? [...acc, ...dep.deps] : [...acc, dep]),
      []
    )
  )
]

export function createDerived(stores, cb) {
  if (!Array.isArray(stores)) stores = [stores]
  let deps = collectWritable(stores)

  let run = () => {
    let values = stores.map(store =>
      store.wrapper ? store.wrapper() : getValue(store)
    )
    return cb(...values)
  }

  let derived = createStore(() => {
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

  let container = {
    run,
    deps,
    ...derived
  }

  return container
}
