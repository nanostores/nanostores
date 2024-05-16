import { atom } from '../atom/index.js'

export let map = (initial = {}) => {
  let $map = atom(initial)

  $map.setKey = function (key, value) {
    if (typeof value === 'undefined' && key in $map.value) {
      $map.value = { ...$map.value }
      delete $map.value[key]
      $map.notify(key)
    } else if (!$map.isEqual($map.value[key], value)) {
      $map.value = {
        ...$map.value,
        [key]: value
      }
      $map.notify(key)
    }
  }

  return $map
}
