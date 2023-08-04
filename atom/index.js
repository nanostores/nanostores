import { clean } from '../clean-stores/index.js'
import { getStoreState, globalContext } from '../context/index.js'

let lastId = 0

export let atom = (initialValue, level = 0) => {
  let $atom = {
    ctx: globalContext,
    get() {
      let state = getStoreState(this, $atom)
      if (!state.lc) {
        this.listen(() => {})()
      }
      return state.v
    },
    id: lastId++,
    iv: initialValue,
    l: level,
    get lc() {
      let state = getStoreState(this, $atom)
      return state.lc
    },
    listen: function (listener, listenerLevel) {
      let state = getStoreState(this, $atom)
      state.lc = state.ls.push(listener, listenerLevel || this.l) / 2

      return () => {
        let index = state.ls.indexOf(listener)
        if (~index) {
          state.ls.splice(index, 2)
          if (!--state.lc) this.off?.()
        }
      }
    },
    notify(changedKey) {
      let state = getStoreState(this, $atom)
      let listenerQueue = this.ctx.q
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
    set(data) {
      let state = getStoreState(this, $atom)
      if (state.v !== data) {
        state.v = data
        this.notify()
      }
    },
    subscribe(listener, listenerLevel) {
      let state = getStoreState(this, $atom)
      let unbind = this.listen(listener, listenerLevel)
      listener(state.v)
      return unbind
    },
    set value(newVal) {
      getStoreState(this, $atom).v = newVal
    },
    get value() {
      let state = getStoreState(this, $atom)
      return state.v
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    $atom[clean] = function () {
      let state = getStoreState(this, $atom)
      state.ls = []
      state.lc = 0
      $atom.off?.()
    }
  }

  return $atom
}
