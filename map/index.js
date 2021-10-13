import { atom } from '../atom/index.js'

export let map = (value = {}) => {
  let store = atom(value)

  store.set = function (newObject) {
    for (let key in newObject) {
      store.setKey(key, newObject[key])
    }
    for (let key in store.value) {
      if (!(key in newObject)) {
        store.setKey(key)
      }
    }
  }
  store.setKey = function (key, newValue) {
    if (store.value) {
      if (typeof newValue === 'undefined') {
        if (key in store.value) {
          let { [key]: _, ...values } = store.value
          store.value = values
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
  }

  return store
}
