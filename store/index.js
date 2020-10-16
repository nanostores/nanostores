let { createNanoEvents } = require('nanoevents')

/**
 * TODO
 */
class Store {
  constructor (client, id) {
    this.listeners = 0
    this.id = id
    this.client = client
    this.emitter = createNanoEvents()
  }
}

module.exports = { Store }
