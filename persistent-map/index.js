let { LocalStore, destroy, triggerChanges } = require('../local-store')

let listeners = {}
function listener (e) {
  for (let prefix in listeners) {
    if (e.key.startsWith(prefix)) {
      let store = listeners[prefix]
      let prop = e.key.slice(prefix.length)
      store[prop] = localStorage[e.key]
      triggerChanges(store, { [prop]: store[prop] })
      break
    }
  }
}

class PersistentMap extends LocalStore {
  constructor () {
    super()
    if (process.env.NODE_ENV !== 'production') {
      if (!this.constructor.id) {
        throw new Error(`Set ${this.constructor.name}.id`)
      }
    }
    if (Object.keys(listeners).length === 0) {
      window.addEventListener('storage', listener)
    }
    let prefix = this.constructor.id + ':'
    listeners[prefix] = this
    Object.keys(localStorage)
      .filter(i => i.startsWith(prefix))
      .forEach(i => {
        this[i.slice(prefix.length)] = localStorage[i]
      })
  }

  change (key, value) {
    this[key] = value
    localStorage[this.constructor.id + ':' + key] = value
    triggerChanges(this, { [key]: value })
  }

  remove (key) {
    delete this[key]
    localStorage.removeItem(this.constructor.id + ':' + key)
    triggerChanges(this, { [key]: undefined })
  }

  [destroy] () {
    delete listeners[this.constructor.id + ':']
    if (Object.keys(listeners).length === 0) {
      window.removeEventListener('storage', listener)
    }
  }
}

module.exports = { PersistentMap }
