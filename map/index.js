import { atom } from '../atom/index.js'

export let map = (value = {}) => {
  let $map = atom(value)

  $map.setKey = function (key, newValue) {
    if (typeof newValue === 'undefined') {
      if (key in this.value) {
        this.value = { ...this.value }
        delete this.value[key]
        this.notify(key)
      }
    } else if (this.value[key] !== newValue) {
      this.value = {
        ...this.value,
        [key]: newValue
      }
      this.notify(key)
    }
  }

  return $map
}
