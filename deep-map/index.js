import { atom } from '../atom/index.js'
import { getPath, setPath } from './path.js'

export { getPath, setPath } from './path.js'

export function deepMap(initial = {}) {
  let $deepMap = atom(initial)
  $deepMap.setKey = (key, newVal) => {
    let oldVal = getPath($deepMap.value, key)
    if (oldVal !== newVal) {
      $deepMap.value = setPath($deepMap.value, key, newVal)
      $deepMap.notify(oldVal, key)
    }
  }
  return $deepMap
}
