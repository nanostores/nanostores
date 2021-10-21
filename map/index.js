import { atom } from '../atom/index.js'

export let map = (value = {}) => {
  let store = atom(value)

  store.setKey = function (key, newValue) {
    if (typeof newValue === 'undefined') {
      if (key in store.value) {
        store.value = { ...store.value }
        delete store.value[key]
        store.notify(key)
      }
    } else if (store.value[key] !== newValue) {
      store.value = {
        ...store.value,
        [key]: newValue
      }
      store.notify(key)
    }
  }

  return store
}
