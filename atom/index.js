import { clean } from '../clean-stores/index.js'

let listenerQueue = []

export let atom = (initialValue, level) => {
  let listeners = []
  let $atom = {
    get() {
      if (!$atom.lc) {
        $atom.listen(() => {})()
      }
      return $atom.value
    },
    l: level || 0,
    lc: 0,
    listen(listener, listenerLevel) {
      $atom.lc = listeners.push(listener, listenerLevel || $atom.l) / 2

      return () => {
        let index = listeners.indexOf(listener)
        if (~index) {
          listeners.splice(index, 2)
          if (!--$atom.lc) $atom.off()
        }
      }
    },
    notify(oldValue, changedKey) {
      let runListenerQueue = !listenerQueue.length
      for (let i = 0; i < listeners.length; i += 2) {
        listenerQueue.push(
          listeners[i],
          listeners[i + 1],
          $atom.value,
          oldValue,
          changedKey
        )
      }

      if (runListenerQueue) {
        for (let i = 0; i < listenerQueue.length; i += 5) {
          let skip
          for (let j = i + 1; !skip && (j += 5) < listenerQueue.length; ) {
            if (listenerQueue[j] < listenerQueue[i + 1]) {
              skip = listenerQueue.push(
                listenerQueue[i],
                listenerQueue[i + 1],
                listenerQueue[i + 2],
                listenerQueue[i + 3],
                listenerQueue[i + 4]
              )
            }
          }

          if (!skip) {
            listenerQueue[i](
              listenerQueue[i + 2],
              listenerQueue[i + 3],
              listenerQueue[i + 4]
            )
          }
        }
        listenerQueue.length = 0
      }
    },
    /* It will be called on last listener unsubscribing.
       We will redefine it in onMount and onStop. */
    off() {},
    set(newValue) {
      let oldValue = $atom.value
      if (oldValue !== newValue) {
        $atom.value = newValue
        $atom.notify(oldValue)
      }
    },
    subscribe(listener, listenerLevel) {
      let unbind = $atom.listen(listener, listenerLevel)
      listener($atom.value)
      return unbind
    },
    value: initialValue
  }

  if (process.env.NODE_ENV !== 'production') {
    $atom[clean] = () => {
      listeners = []
      $atom.lc = 0
      $atom.off()
    }
  }

  return $atom
}
