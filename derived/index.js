import { connect } from '../connect/index.js'
import { local } from '../local/index.js'

export function derived (storeClasses, cb) {
  if (!Array.isArray(storeClasses)) storeClasses = [storeClasses]
  let stores = storeClasses.map(i => i.load())
  return local(undefined, store => {
    connect(store, stores, () => ({ value: cb(...stores) }))
  })
}
