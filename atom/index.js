import { clean } from '../clean-stores/index.js'
import { getListenerQueue, getStoreState } from '../context/index.js'

export let atom = (initialValue, level) => {
  let store = {
    l: level || 0,
    iv: initialValue,
    get lc() {
      let state = getStoreState(store)
      return state.lc
    },
    get value() {
      let state = getStoreState(store)
      return state.v
    },
    set(data) {
      let state = getStoreState(store)
      if (state.v !== data) {
        state.v = data
        store.notify()
      }
    },
    get() {
      let state = getStoreState(store)
      if (!state.lc) {
        store.listen(() => {})()
      }
      return state.v
    },
    notify(changedKey) {
      let state = getStoreState(store)
      let listenerQueue = getListenerQueue()
      let runListenerQueue = !listenerQueue.length
      for (let i = 0; i < state.ls.length; i += 2) {
        listenerQueue.push(state.ls[i], state.v, changedKey, state.ls[i + 1])
      }

      if (runListenerQueue) {
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
      let state = getStoreState(store)
      state.lc = state.ls.push(listener, listenerLevel || store.l) / 2

      return () => {
        let index = state.ls.indexOf(listener)
        if (~index) {
          state.ls.splice(index, 2)
          state.lc--
          if (!state.lc) store.off()
        }
      }
    },
    subscribe(cb, listenerLevel) {
      let state = getStoreState(store)
      let unbind = store.listen(cb, listenerLevel)
      cb(state.v)
      return unbind
    },
    off() {} /* It will be called on last listener unsubscribing.
                We will redefine it in onMount and onStop. */
  }

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      let state = getStoreState(store)
      state.ls = []
      state.lc = 0
      store.off()
    }
  }

  return store
}
