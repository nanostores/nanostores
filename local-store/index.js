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
    this.listeners = []
  }

  subscribe (listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(i => i !== listener)
      if (!this.listeners.length) {
        setTimeout(() => {
          if (!this.listeners.length) {
            if (this.constructor.loaded) {
              if (this.destroy) this.destroy()
              delete this.constructor.loaded
            }
          }
        })
      }
    }
  }

  changeKey (key, value, swallow) {
    if (this[key] === value) return
    this[key] = value
    if (!swallow) {
      if (!this.changesBunch) {
        this.changesBunch = {}
        setTimeout(() => {
          let totalChanges = this.changesBunch
          delete this.changesBunch
          for (let listener of this.listeners) {
            listener(this, totalChanges)
          }
        })
      }
      this.changesBunch[key] = value
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  LocalStore.prototype.changeKey = function (key, value, swallow) {
    if (this[key] === value) return
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      writable: false,
      value
    })
    if (!swallow) {
      if (!this.changesBunch) {
        this.changesBunch = {}
        setTimeout(() => {
          let totalChanges = this.changesBunch
          delete this.changesBunch
          for (let listener of this.listeners) {
            listener(this, totalChanges)
          }
        })
      }
      this.changesBunch[key] = value
    }
  }
}

module.exports = { LocalStore }
