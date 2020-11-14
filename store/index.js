let { createNanoEvents } = require('nanoevents')

let { listeners, emitter, loguxClient } = require('../symbols')

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

module.exports = { LocalStore, RemoteStore }
