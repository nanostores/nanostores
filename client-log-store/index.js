let { RemoteStore } = require('../remote-store')

let loguxClient
if (process.env.NODE_ENV === 'production') {
  loguxClient = Symbol()
} else {
  loguxClient = Symbol('loguxClient')
}

class ClientLogStore extends RemoteStore {
  constructor (id, client) {
    super(id)
    if (process.env.NODE_ENV !== 'production') {
      if (!client) {
        throw new Error('Missed Logux client')
      }
    }
    this[loguxClient] = client
  }
}

module.exports = { ClientLogStore, loguxClient }
