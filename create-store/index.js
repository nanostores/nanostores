import { clean } from '../clean-stores/index.js'

export const STORE_CLEAN_DELAY = 1000

export function createStore(init) {
  let currentListeners
  let nextListeners = []
  let destroy

  let store = {
    set(newValue) {
      store.value = newValue
      currentListeners = nextListeners
      for (let listener of currentListeners) {
        listener(store.value)
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
              destroy = undefined
              store.active = undefined
            }
          }, STORE_CLEAN_DELAY)
        }
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      if (destroy) destroy()
      store.active = false
      store.value = undefined
      nextListeners = []
      destroy = undefined
    }
  }

  return store
}
