import { clean } from '../clean-stores/index.js'

export function createStore(init) {
  let listeners = []
  let destroy

  let store = {
    set(newValue) {
      store.value = newValue
      for (let listener of listeners) {
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
      listeners.push(listener)
      return () => {
        let index = listeners.indexOf(listener)
        listeners.splice(index, 1)
        if (!listeners.length) {
          setTimeout(() => {
            if (store.active && !listeners.length) {
              if (destroy) destroy()
              destroy = undefined
              store.active = undefined
            }
          }, 1000)
        }
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      if (destroy) destroy()
      store.active = false
      store.value = undefined
      listeners = []
      destroy = undefined
    }
  }

  return store
}
