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

// Advance lqIndex before calling a listener: batch() re-enters drainQueue
// from its finally block, and the nested drain must resume, not replay.
let drainQueue = () => {
  let thrown
  let i
  while (lqIndex < listenerQueue.length) {
    i = lqIndex
    lqIndex += QUEUE_ITEMS_PER_LISTENER
    try {
      listenerQueue[i](
        listenerQueue[i + 1].value,
        listenerQueue[i + 2],
        listenerQueue[i + 3]
      )
    } catch (e) {
      thrown = e
    }
  }
  listenerQueue.length = lqIndex = 0
  if (thrown) throw thrown
}

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
    eq: Object.is,
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
        for (let i = lqIndex; i < listenerQueue.length; ) {
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
      if (!$atom.eq(oldValue, newValue)) {
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
