import { clean } from '../clean-stores/index.js'

let listenerQueue = []
export let epoch = 0

export let atom = (initialValue) => {
  let listeners = []
  let $atom = {
    get() {
      if (!$atom.lc) {
        $atom.listen(() => {})()
      }
      return $atom.value
    },
    lc: 0,
    listen(listener) {
      $atom.lc = listeners.push(listener)

      return () => {
        let index = listeners.indexOf(listener)
        let queueIndex = listenerQueue.indexOf(listener)
        if (~index) {
          listeners.splice(index, 1)
          if (!--$atom.lc) $atom.off()
        }
        if (~queueIndex) {
          listenerQueue.splice(index, 4)
        }
      }
    },
    notify(oldValue, changedKey) {
      epoch++
      let runListenerQueue = !listenerQueue.length
      for (let listener of listeners) {
        listenerQueue.push(
          listener,
          $atom.value,
          oldValue,
          changedKey
        )
      }

      if (runListenerQueue) {
        for (let i = 0; i < listenerQueue.length; i += 4) {
            listenerQueue[i](
              listenerQueue[i + 1],
              listenerQueue[i + 2],
              listenerQueue[i + 3]
            )
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
    subscribe(listener) {
      let unbind = $atom.listen(listener)
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
