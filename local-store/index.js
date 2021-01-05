let { createNanoEvents } = require('nanoevents')

let listeners, subscribe, emitter, destroy, bunching
if (process.env.NODE_ENV === 'production') {
  listeners = Symbol()
  subscribe = Symbol()
  bunching = Symbol()
  emitter = Symbol()
  destroy = Symbol()
} else {
  listeners = Symbol('listeners')
  subscribe = Symbol('subscribe')
  bunching = Symbol('bunching')
  emitter = Symbol('emitter')
  destroy = Symbol('destroy')
}

class LocalStore {
  constructor () {
    this[listeners] = 0
    this[emitter] = createNanoEvents()
  }

  [subscribe] (listener) {
    this[listeners] += 1
    let unbind = this[emitter].on('change', listener)
    return () => {
      unbind()
      this[listeners] -= 1
      if (!this[listeners]) {
        setTimeout(() => {
          if (!this[listeners] && this.constructor.loaded) {
            this.constructor.loaded = undefined
            if (this[destroy]) this[destroy]()
          }
        })
      }
    }
  }
}

LocalStore.load = function (client) {
  if (!this.loaded) {
    this.loaded = new this(client)
  }
  return this.loaded
}

function triggerChanges (store, changes = {}) {
  if (store[bunching]) {
    store[bunching] = { ...store[bunching], ...changes }
  } else {
    store[bunching] = changes
    setTimeout(() => {
      let totalChanges = store[bunching]
      delete store[bunching]
      store[emitter].emit('change', store, totalChanges)
    })
  }
}

module.exports = {
  triggerChanges,
  LocalStore,
  listeners,
  subscribe,
  emitter,
  destroy
}
