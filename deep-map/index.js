import { atom } from '../atom/index.js'
import { getPath, setPath } from './path.js'

export { getPath, setPath } from './path.js'

export function deepMap(initial = {}) {
  let $deepMap = atom(initial)
  $deepMap.setKey = (key, value) => {
    let oldMap = $deepMap.value
    if (getPath($deepMap.value, key) !== value) {
      $deepMap.value = { ...setPath($deepMap.value, key, value) }
      $deepMap.notify(oldMap, key)
    }
  }
  return $deepMap
}
