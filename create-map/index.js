import { clean } from '../clean-stores/index.js'

export function createMap(init) {
  let listeners = []
  let destroy

  let store = {
    active: false,
    value: {},

    set(newObject) {
      for (let key in newObject) {
        store.setKey(key, newObject[key])
      }
      for (let key in store.value) {
        if (!(key in newObject)) {
          store.setKey(key)
        }
      }
    },

    setKey(key, newValue) {
      if (store.value) {
        if (typeof newValue === 'undefined') {
          if (key in store.value) {
            delete store.value[key]
            store.notify(key)
          }
        } else if (store.value[key] !== newValue) {
          store.value[key] = newValue
          store.notify(key)
        }
      }
    },

    notify(changedKey) {
      for (let listener of listeners) {
        listener(store.value, changedKey)
      }
    },

    subscribe(listener) {
      let unbind = store.listen(listener)
      listener(store.value)
      return unbind
    },

    listen(listener) {
      if (!store.active) {
        store.active = true
        if (init) destroy = init()
      }
      listeners.push(listener)
      return () => {
        let index = listeners.indexOf(listener)
        listeners.splice(index, 1)
        if (!listeners.length) {
          setTimeout(() => {
            if (store.active && !listeners.length) {
              if (destroy) destroy()
              store.active = false
              destroy = undefined
            }
          }, 1000)
        }
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      if (destroy) destroy()
      store.active = undefined
      store.value = undefined
      listeners = []
      destroy = undefined
    }
  }

  return store
}
