import { atom } from '../atom/index.js'

export let map = (value = {}) => {
  let $map = atom(value)

  $map.setKey = function (key, newValue) {
    let oldValue = $map.value[key]
    if (typeof newValue === 'undefined' && key in $map.value) {
      $map.value = { ...$map.value }
      delete $map.value[key]
      $map.notify(oldValue, key)
    } else if (oldValue !== newValue) {
      $map.value = {
        ...$map.value,
        [key]: newValue
      }
      $map.notify(oldValue, key)
    }
  }

  return $map
}
