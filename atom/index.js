import { clean } from '../clean-stores/index.js'

let listenerQueue = []

export let notifyId = 0

export let atom = (initialValue, level) => {
  let currentListeners
  let nextListeners = []
  let store = {
    lc: 0,
    l: level || 0,
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
      let runListenerQueue = !listenerQueue.length
      for (let i = 0; i < currentListeners.length; i += 2) {
        listenerQueue.push(
          currentListeners[i],
          store.value,
          changedKey,
          currentListeners[i + 1]
        )
      }

      if (runListenerQueue) {
        notifyId++
        for (let i = 0; i < listenerQueue.length; i += 4) {
          let skip = false
          for (let j = i + 7; j < listenerQueue.length; j += 4) {
            if (listenerQueue[j] < listenerQueue[i + 3]) {
              skip = true
              break
            }
          }

          if (skip) {
            listenerQueue.push(
              listenerQueue[i],
              listenerQueue[i + 1],
              listenerQueue[i + 2],
              listenerQueue[i + 3]
            )
          } else {
            listenerQueue[i](listenerQueue[i + 1], listenerQueue[i + 2])
          }
        }
        listenerQueue.length = 0
      }
    },
    listen(listener, listenerLevel) {
      if (nextListeners === currentListeners) {
        nextListeners = nextListeners.slice()
      }

      store.lc = nextListeners.push(listener, listenerLevel || store.l) / 2

      return () => {
        if (nextListeners === currentListeners) {
          nextListeners = nextListeners.slice()
        }
        let index = nextListeners.indexOf(listener)
        if (~index) {
          nextListeners.splice(index, 2)
          store.lc--
          if (!store.lc) store.off()
        }
      }
    },
    subscribe(cb, listenerLevel) {
      let unbind = store.listen(cb, listenerLevel)
      cb(store.value)
      return unbind
    },
    off() {} /* It will be called on last listener unsubscribing.
                We will redefine it in onMount and onStop. */
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
