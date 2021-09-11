import { STORE_CLEAN_DELAY } from '../create-store/index.js'
import { clean } from '../clean-stores/index.js'

export function createMap(init) {
  let currentListeners
  let nextListeners = []
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
      currentListeners = nextListeners
      for (let listener of currentListeners) {
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
        store.value = {}
        if (init) destroy = init()
      }
      if (nextListeners === currentListeners) {
        nextListeners = nextListeners.slice()
      }
      nextListeners.push(listener)
      return () => {
        if (nextListeners === currentListeners) {
          nextListeners = nextListeners.slice()
        }
        let index = nextListeners.indexOf(listener)
        nextListeners.splice(index, 1)
        if (!nextListeners.length) {
          setTimeout(() => {
            if (store.active && !nextListeners.length) {
              if (destroy) destroy()
              store.active = false
              destroy = undefined
            }
          }, STORE_CLEAN_DELAY)
        }
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      if (destroy) destroy()
      store.active = undefined
      store.value = undefined
      nextListeners = []
      destroy = undefined
    }
  }

  return store
}
