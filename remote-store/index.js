let { createNanoEvents } = require('nanoevents')

let { listeners, emitter, subscribe, destroy } = require('../local-store')

let loading, loaded
if (process.env.NODE_ENV === 'production') {
  loading = Symbol()
  loaded = Symbol()
} else {
  loading = Symbol('loading')
  loaded = Symbol('loaded')
}

class RemoteStore {
  constructor (id) {
    this[listeners] = 0
    this[emitter] = createNanoEvents()
    this.id = id
  }

  [subscribe] (listener) {
    this[listeners] += 1
    let unbind
    if (this[loaded]) {
      unbind = this[emitter].on('change', listener)
    } else {
      this[loading]
        .then(() => {
          unbind = this[emitter].on('change', listener)
        })
        .catch(() => {})
    }
    return () => {
      if (unbind) unbind()
      this[listeners] -= 1
      if (!this[listeners]) {
        setTimeout(() => {
          if (!this[listeners] && this.constructor.loaded.has(this.id)) {
            this.constructor.loaded.delete(this.id)
            if (this[destroy]) this[destroy]()
          }
        })
      }
    }
  }
}

RemoteStore.load = function (id, client) {
  if (!this.loaded) {
    this.loaded = new Map()
  }
  if (!this.loaded.has(id)) {
    this.loaded.set(id, new this(id, client))
  }
  return this.loaded.get(id)
}

module.exports = {
  RemoteStore,
  loading,
  loaded
}
