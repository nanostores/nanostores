import { createStore } from '../create-store/index.js'
import { getValue } from '../get-value/index.js'

export function createDerived(stores, cb) {
  if (!Array.isArray(stores)) stores = [stores]
  let derived = createStore(() => {
    let values = stores.map(store => getValue(store))
    derived.set(cb(...values))
    let unbinds = stores.map((store, index) => {
      return store.listen(value => {
        values[index] = value
        derived.set(cb(...values))
      })
    })
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })
  return derived
}
