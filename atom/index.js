import { clean } from '../clean-stores/index.js'
import { getListenerQueue, getStoreState } from '../context/index.js'

export let atom = (initialValue, level) => {
  let $atom = {
    get() {
      let state = getStoreState($atom)
      if (!state.lc) {
        $atom.listen(() => {})()
      }
      return state.v
    },
    iv: initialValue,
    l: level || 0,
    get lc() {
      let state = getStoreState($atom)
      return state.lc
    },
    listen(listener, listenerLevel) {
      let state = getStoreState($atom)
      state.lc = state.ls.push(listener, listenerLevel || $atom.l) / 2

      return () => {
        let index = state.ls.indexOf(listener)
        if (~index) {
          state.ls.splice(index, 2)
          state.lc--
          if (!state.lc) $atom.off()
        }
      }
    },
    notify(changedKey) {
      let state = getStoreState($atom)
      let listenerQueue = getListenerQueue()
      let runListenerQueue = !listenerQueue.length

      for (let i = 0; i < state.ls.length; i += 2) {
        listenerQueue.push(state.ls[i], state.ls[i + 1], state.v, changedKey)
      }

      if (runListenerQueue) {
        for (let i = 0; i < listenerQueue.length; i += 4) {
          let skip
          for (let j = i + 1; !skip && (j += 4) < listenerQueue.length; ) {
            if (listenerQueue[j] < listenerQueue[i + 1]) {
              skip = listenerQueue.push(
                listenerQueue[i],
                listenerQueue[i + 1],
                listenerQueue[i + 2],
                listenerQueue[i + 3]
              )
            }
          }
          if (!skip) {
            listenerQueue[i](listenerQueue[i + 2], listenerQueue[i + 3])
          }
        }
        listenerQueue.length = 0
      }
    },
    off() {} /* It will be called on last listener unsubscribing.
                We will redefine it in onMount and onStop. */,
    set(data) {
      let state = getStoreState($atom)
      if (state.v !== data) {
        state.v = data
        $atom.notify()
      }
    },
    subscribe(listener, listenerLevel) {
      let state = getStoreState($atom)
      let unbind = $atom.listen(listener, listenerLevel)
      listener(state.v)
      return unbind
    },
    get value() {
      let state = getStoreState($atom)
      return state.v
    },
    set value(newVal) {
      getStoreState($atom).v = newVal
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    $atom[clean] = () => {
      let state = getStoreState($atom)
      state.ls = []
      state.lc = 0
      $atom.off()
    }
  }

  return $atom
}
