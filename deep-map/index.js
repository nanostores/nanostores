import { NONE } from '../spred.js'

import { atom } from '../atom/index.js'
import { getPath, setPath } from './path.js'

export { getPath, setByKey, setPath } from './path.js'

/* @__NO_SIDE_EFFECTS__ */
export const deepMap = (initial = {}) => {
  let $deepMap = atom(initial)
  $deepMap.setKey = (key, value) => {
    $deepMap.update(map => {
      if (getPath(map, key) !== value) {
        let oldValue = map
        let newValue = setPath(oldValue, key, value)
        return newValue
      }

      return NONE
    })
  }
  return $deepMap
}

export function getKey(store, key) {
  let value = store.get()
  return getPath(value, key)
}
