export const atom = (value = {}) => {
  let currentListeners
  let nextListeners = []
  let store = {
    lc: 0,
    value,
    set(data) {
      store.value = data
      store.notify()
      return store.value
    },
    get() {
      let unsub
      if (!store.lc) unsub = store.listen(() => {})
      unsub && unsub()
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
        nextListeners.splice(index, 1)
        store.lc--
        if (!nextListeners.length) store.off()
      }
    },
    subscribe(cb) {
      let unbind = store.listen(cb)
      cb(store.value)
      return unbind
    },
    off() {
      nextListeners = []
      currentListeners = []
    }
  }
  return store
}
