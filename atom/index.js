import { clean } from '../clean-stores/index.js'

export let atom = initialValue => {
  let currentListeners
  let nextListeners = []
  let store = {
    lc: 0,
    value: initialValue,
    set(data) {
      store.value = data
      store.notify()
    },
    get() {
      if (!store.lc) {
        store.listen(() => {})()
      }
      return store.value
    },
    notify(changedKey) {
      currentListeners = nextListeners
      for (let listener of currentListeners) {
        listener(store.value, changedKey)
      }
    },
    listen(listener) {
      if (nextListeners === currentListeners) {
        nextListeners = nextListeners.slice()
      }
      store.lc = nextListeners.push(listener)
      return () => {
        if (nextListeners === currentListeners) {
          nextListeners = nextListeners.slice()
        }
        let index = nextListeners.indexOf(listener)
        if (~index) {
          nextListeners.splice(index, 1)
          store.lc--
          if (!store.lc) store.off()
        }
      }
    },
    subscribe(cb) {
      let unbind = store.listen(cb)
      cb(store.value)
      return unbind
    },
    off() {}
  }

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      nextListeners = []
      store.lc = 0
      store.off()
    }
  }

  return store
}
