let { createNanoEvents } = require('nanoevents')

let listeners, emitter, loguxClient, loading, destroy, loaded

if (process.env.NODE_ENV === 'production') {
  loguxClient = Symbol()
  listeners = Symbol()
  emitter = Symbol()
  loading = Symbol()
  destroy = Symbol()
  loaded = Symbol()
} else {
  loguxClient = Symbol('loguxClient')
  listeners = Symbol('listeners')
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
}

class RemoteStore extends LocalStore {
  constructor (client, id) {
    super(client)
    this.id = id
  }
}

module.exports = {
  LocalStore,
  RemoteStore,
  listeners,
  emitter,
  loguxClient,
  loading,
  loaded,
  destroy
}
