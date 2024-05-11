import { clean } from '../clean-stores/index.js'

let listenerQueue = []
let lqIndex = 0
const QUEUE_ITEMS_PER_LISTENER = 2
export let epoch = 0
let batchLevel = 0

export let batch = (cb) => {
  let queueWasEmpty = !listenerQueue.length
  ++batchLevel
  try {
    return cb()
  } finally {
    if (!--batchLevel && queueWasEmpty) {
      runListenerQueue()
    }
  }
}

let runListenerQueue = () => {
  for (lqIndex = 0; lqIndex < listenerQueue.length; lqIndex += QUEUE_ITEMS_PER_LISTENER) {
    listenerQueue[lqIndex](listenerQueue[lqIndex + 1])
  }
  listenerQueue.length = 0
}

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
    listen(_listener) {
      let listener = (changedKey) => {
        let value = $atom.get()
        if (value === oldValue) return
        let currentOldValue = oldValue
        oldValue = value
        _listener(value, currentOldValue, changedKey)
      }
      $atom.lc = listeners.push(listener)
      // Must come after updating `lc` otherwise get() will call back into listen() when lc is 0.
      let oldValue = $atom.get()

      return () => {
        for (let i = lqIndex + QUEUE_ITEMS_PER_LISTENER; i < listenerQueue.length;) {
          if (listenerQueue[i] === listener) {
            listenerQueue.splice(i, QUEUE_ITEMS_PER_LISTENER)
          } else {
            i += QUEUE_ITEMS_PER_LISTENER
          }
        }

        let index = listeners.indexOf(listener)
        if (~index) {
          listeners.splice(index, 1)
          if (!--$atom.lc) $atom.off()
        }
      }
    },
    notify(oldValue, changedKey) {
      epoch++
      let queueWasEmpty = !listenerQueue.length
      for (let listener of listeners) {
        listenerQueue.push(
          listener,
          changedKey
        )
      }
      if (!batchLevel && queueWasEmpty) runListenerQueue()
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
      // The call to listen() above calls $atom.get(), so we know $atom.value isn't stale
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
