import { atom } from '../atom/index.js'
import { getPath, setPath } from './path.js'

export { getPath, setPath } from './path.js'

export function deepMap(initial = {}) {
  let $deepMap = atom(initial)
  $deepMap.setKey = function (key, value) {
    if (getPath(this.value, key) !== value) {
      this.value = setPath(this.value, key, value)
      this.notify(key)
    }
  }
  return $deepMap
}
