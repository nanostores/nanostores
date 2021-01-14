let { listeners, subscribe, bunching, destroy, change } = require('../store')

class LocalStore {
  constructor () {
    this[listeners] = []
  }

  [subscribe] (listener) {
    this[listeners].push(listener)
    return () => {
      this[listeners] = this[listeners].filter(i => i !== listener)
      if (!this[listeners].length) {
        setTimeout(() => {
          if (!this[listeners].length) {
            if (this.constructor.loaded) {
              if (this[destroy]) this[destroy]()
              delete this.constructor.loaded
            }
          }
        })
      }
    }
  }

  [change] (key, value, swallow) {
    if (this[key] === value) return
    this[key] = value
    if (!swallow) {
      if (!this[bunching]) {
        this[bunching] = {}
        setTimeout(() => {
          let totalChanges = this[bunching]
          delete this[bunching]
          for (let listener of this[listeners]) {
            listener(this, totalChanges)
          }
        })
      }
      this[bunching][key] = value
    }
  }
}

LocalStore.load = function (client) {
  if (!this.loaded) {
    this.loaded = new this(client)
  }
  return this.loaded
}

LocalStore.subscribe = function (cb) {
  return this.load()[subscribe](cb)
}

if (process.env.NODE_ENV !== 'production') {
  LocalStore.prototype[change] = function (key, value, swallow) {
    if (this[key] === value) return
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      writable: false,
      value
    })
    if (!swallow) {
      if (!this[bunching]) {
        this[bunching] = {}
        setTimeout(() => {
          let totalChanges = this[bunching]
          delete this[bunching]
          for (let listener of this[listeners]) {
            listener(this, totalChanges)
          }
        })
      }
      this[bunching][key] = value
    }
  }
}

module.exports = {
  LocalStore
}
