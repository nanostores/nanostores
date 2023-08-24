import { atom } from '../atom/index.js'
import { getPath, setPath } from './path.js'

export { getPath, setPath } from './path.js'

export function deepMap(initial = {}) {
  let $deepMap = atom(initial)
  $deepMap.setKey = (key, newValue) => {
    let oldValue = getPath($deepMap.value, key)
    if (oldValue !== newValue) {
      $deepMap.value = { ...setPath($deepMap.value, key, newValue) }
      $deepMap.notify(key)
    }
  }
  return $deepMap
}
