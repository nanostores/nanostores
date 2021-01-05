let { createNanoEvents } = require('nanoevents')

let listeners, subscribe, emitter, destroy
if (process.env.NODE_ENV === 'production') {
  listeners = Symbol()
  subscribe = Symbol()
  emitter = Symbol()
  destroy = Symbol()
} else {
  listeners = Symbol('listeners')
  subscribe = Symbol('subscribe')
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

module.exports = {
  LocalStore,
  listeners,
  subscribe,
  emitter,
  destroy
}
