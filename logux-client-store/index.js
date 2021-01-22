let { RemoteStore } = require('../remote-store')

class LoguxClientStore extends RemoteStore {
  constructor (id, client) {
    super(id)
    if (process.env.NODE_ENV !== 'production') {
      if (!client) {
        throw new Error('Missed Logux client')
      }
    }
    this.loguxClient = client
  }
}

module.exports = { LoguxClientStore }
