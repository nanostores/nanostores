import { RemoteStore } from '../remote-store/index.js'

export class LoguxClientStore extends RemoteStore {
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
