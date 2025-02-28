import { getPath } from '../deep-map/path.js'

export function getKey(store, key) {
  let value = store.get()
  return getPath(value, key)
}
