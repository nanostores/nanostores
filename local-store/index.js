class LocalStore {
  static load (client) {
    if (!this.loaded) {
      this.loaded = new this(client)
    }
    return this.loaded
  }

  static subscribe (cb) {
    return this.load().subscribe(cb)
  }

  constructor () {
    this.changeListeners = []
  }

  subscribe (listener) {
    listener(this, {})
    return this.addListener(listener)
  }

  addListener (listener) {
    this.changeListeners.push(listener)
    return () => {
      this.changeListeners = this.changeListeners.filter(i => i !== listener)
      if (!this.changeListeners.length) {
        setTimeout(() => {
          if (!this.changeListeners.length) {
            if (this.constructor.loaded) {
              if (this.destroy) this.destroy()
              delete this.constructor.loaded
            }
          }
        })
      }
    }
  }

  changeKey (key, value) {
    if (this[key] === value) return
    this[key] = value
    if (!this.changesBunch) {
      this.changesBunch = {}
      setTimeout(() => {
        let totalChanges = this.changesBunch
        delete this.changesBunch
        for (let listener of this.changeListeners) {
          listener(this, totalChanges)
        }
      })
    }
    this.changesBunch[key] = value
  }
}

if (process.env.NODE_ENV !== 'production') {
  LocalStore.prototype.changeKey = function (key, value) {
    if (this[key] === value) return
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      writable: false,
      value
    })
    if (!this.changesBunch) {
      this.changesBunch = {}
      setTimeout(() => {
        let totalChanges = this.changesBunch
        delete this.changesBunch
        for (let listener of this.changeListeners) {
          listener(this, totalChanges)
        }
      })
    }
    this.changesBunch[key] = value
  }
}

module.exports = { LocalStore }
