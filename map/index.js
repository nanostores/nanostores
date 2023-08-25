import { atom } from '../atom/index.js'

export let map = (value = {}) => {
  let $map = atom(value)

  $map.setKey = function (key, newVal) {
    let oldVal = $map.value[key]
    if (oldVal === newVal) return
    $map.value = { ...$map.value, [key]: newVal }
    if (typeof newVal === 'undefined' && key in $map.value) {
      delete $map.value[key]
    }
    $map.notify(oldVal, key)
  }

  return $map
}
