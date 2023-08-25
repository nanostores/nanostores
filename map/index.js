import { atom } from '../atom/index.js'

export let map = (value = {}) => {
  let $map = atom(value)

  $map.setKey = function (key, newVal) {
    let oldVal = $map.value[key]
    if (typeof newVal === 'undefined' && key in $map.value) {
      $map.value = { ...$map.value }
      delete $map.value[key]
      $map.notify(oldVal, key)
    } else if (oldVal !== newVal) {
      $map.value = {
        ...$map.value,
        [key]: newVal,
      }
      $map.notify(oldVal, key)
    }
  }

  return $map
}
