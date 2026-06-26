import { clean } from '../clean-stores/index.js'

let listenerQueue = []
let lqIndex = 0
let batchSeen = null
const QUEUE_ITEMS_PER_LISTENER = 4
// Use globalThis.nanostoresGlobal to store epoch so all module instances share
// the same counter. This fixes issues when Nano Store is bundled separately
// in different parts of an application (e.g., tree-shaking separates core
// from React), causing each bundle to have its own epoch instance.
export const nanostoresGlobal = (globalThis.nanostoresGlobal ||= { epoch: 0 })

let drainQueue = () => {
  for (
    lqIndex = 0;
    lqIndex < listenerQueue.length;
    lqIndex += QUEUE_ITEMS_PER_LISTENER
  ) {
    listenerQueue[lqIndex](
      listenerQueue[lqIndex + 1].value,
      listenerQueue[lqIndex + 2],
      listenerQueue[lqIndex + 3]
    )
  }
  listenerQueue.length = 0
}

/* @__NO_SIDE_EFFECTS__ */
export const batch = fn => {
  let outer = !batchSeen
  if (outer) batchSeen = new Set()
  try {
    fn()
  } finally {
    if (outer) {
      try {
        if (listenerQueue.length) drainQueue()
      } finally {
        batchSeen = null
      }
    }
  }
}

/* @__NO_SIDE_EFFECTS__ */
export const atom = initialValue => {
  let listeners = []
  let $atom = {
    get() {
      if (!$atom.lc) {
        $atom.listen(() => {})()
      }
      return $atom.value
    },
    init: initialValue,
    lc: 0,
    listen(listener) {
      $atom.lc = listeners.push(listener)

      return () => {
        for (
          let i = lqIndex + QUEUE_ITEMS_PER_LISTENER;
          i < listenerQueue.length;
        ) {
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
      nanostoresGlobal.epoch++
      let runListenerQueue = !listenerQueue.length && !batchSeen
      for (let listener of listeners) {
        if (batchSeen?.has(listener)) continue
        batchSeen?.add(listener)
        listenerQueue.push(
          listener,
          $atom,
          oldValue,
          batchSeen ? undefined : changedKey
        )
      }

      if (runListenerQueue) {
        drainQueue()
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

export const readonlyType = store => store
