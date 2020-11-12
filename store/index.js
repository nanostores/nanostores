let { createNanoEvents } = require('nanoevents')

let { listeners, emitter, loguxClient } = require('../symbols')

class Store {
  constructor (client, id) {
    this.id = id
    this[loguxClient] = client
    this[listeners] = 0
    this[emitter] = createNanoEvents()
  }
}

module.exports = { Store }
