let { createNanoEvents } = require('nanoevents')

let loguxClient, listeners, subscribe, emitter, loading, destroy, loaded

if (process.env.NODE_ENV === 'production') {
  loguxClient = Symbol()
  listeners = Symbol()
  subscribe = Symbol()
  emitter = Symbol()
  loading = Symbol()
  destroy = Symbol()
  loaded = Symbol()
} else {
  loguxClient = Symbol('loguxClient')
  listeners = Symbol('listeners')
  subscribe = Symbol('subscribe')
  loading = Symbol('loading')
  emitter = Symbol('emitter')
  destroy = Symbol('destroy')
  loaded = Symbol('loaded')
}

class LocalStore {
  constructor (client) {
    this[loguxClient] = client
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
          if (
            !this[listeners] &&
            this[loguxClient].objects.has(this.constructor)
          ) {
            this[loguxClient].objects.delete(this.constructor)
            if (this[destroy]) this[destroy]()
          }
        }, 10)
      }
    }
  }
}

class RemoteStore extends LocalStore {
  constructor (client, id) {
    super(client)
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
          if (!this[listeners] && this[loguxClient].objects.has(this.id)) {
            this[loguxClient].objects.delete(this.id)
            if (this[destroy]) this[destroy]()
          }
        }, 10)
      }
    }
  }
}

module.exports = {
  RemoteStore,
  loguxClient,
  LocalStore,
  listeners,
  subscribe,
  emitter,
  loading,
  destroy,
  loaded
}
