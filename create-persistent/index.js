import { createMap } from '../create-map/index.js'

export function createPersistent(initial = {}, prefix = '') {
  function listener(e) {
    if (e.key.startsWith(prefix)) {
      store.setKey(e.key.slice(prefix.length), e.newValue)
    }
  }

  let store = createMap(() => {
    let data = { ...initial }
    if (localStorage) {
      for (let key in localStorage) {
        if (key.startsWith(prefix)) {
          data[key.slice(prefix.length)] = localStorage[key]
        }
      }
    }
    store.set(data)
    window.addEventListener('storage', listener)
    return () => {
      window.removeEventListener('storage', listener)
    }
  })

  let setKey = store.setKey
  store.setKey = (key, newValue) => {
    if (typeof newValue === 'undefined') {
      localStorage.removeItem(prefix + key)
    } else {
      localStorage.setItem(prefix + key, newValue)
    }
    setKey(key, newValue)
  }

  return store
}
