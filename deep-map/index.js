import { atom } from '../atom/index.js'
import { getPath, setPath } from './path.js'

export { getPath, setByKey, setPath } from './path.js'

/* @__NO_SIDE_EFFECTS__ */
export const deepMap = (initial = {}) => {
  let $deepMap = atom(initial)

  $deepMap.setKey = (key, value, options) => {
    const pathData = getPath($deepMap.value, key)
    if (pathData !== value) {
      let oldValue = $deepMap.value
      let newValue = value;
      if (options?.shouldMerge && typeof value === 'object' && value !== null) {
        if (typeof pathData !== 'object' || pathData === null) {
          newValue = { ...value, previousValue: pathData }
        } else {
          newValue = { ...pathData, ...value }
        }
      }
      $deepMap.value = setPath($deepMap.value, key, newValue)
      $deepMap.notify(oldValue, key)
    }
  }
  return $deepMap
}

export function getKey(store, key) {
  let value = store.get()
  return getPath(value, key)
}
