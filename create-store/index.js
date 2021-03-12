import { clean } from '../clean-stores/index.js'

export function createStore(init) {
  let listeners
  let destroy

  let store = {
    value: undefined,

    set(newValue) {
      if (listeners) {
        store.value = newValue
        for (let listener of listeners) {
          listener(store.value)
        }
      }
    },

    subscribe(listener) {
      let unbind = store.listen(listener)
      listener(store.value)
      return unbind
    },

    listen(listener) {
      if (!listeners) {
        listeners = []
        if (init) destroy = init()
      }
      listeners.push(listener)
      return () => {
        let index = listeners.indexOf(listener)
        listeners.splice(index, 1)
        if (listeners.length === 0) {
          setTimeout(() => {
            if (listeners && listeners.length === 0) {
              if (destroy) destroy()
              listeners = undefined
              destroy = undefined
              store.value = undefined
            }
          }, 1000)
        }
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      if (destroy) destroy()
      store.value = undefined
      listeners = undefined
      destroy = undefined
    }
  }

  return store
}
