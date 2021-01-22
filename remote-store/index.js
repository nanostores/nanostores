class RemoteStore {
  static load (id, client) {
    if (!this.loaded) {
      this.loaded = new Map()
    }
    if (!this.loaded.has(id)) {
      this.loaded.set(id, new this(id, client))
    }
    return this.loaded.get(id)
  }

  constructor (id) {
    this.listeners = []
    this.id = id
  }

  subscribe (listener) {
    listener(this, {})
    return this.addListener(listener)
  }

  addListener (listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(i => i !== listener)
      if (!this.listeners.length) {
        setTimeout(() => {
          if (!this.listeners.length && this.constructor.loaded) {
            if (this.constructor.loaded.delete(this.id)) {
              if (this.destroy) this.destroy()
            }
          }
        })
      }
    }
  }

  notifyListener (key, value) {
    if (!this.changesBunch) {
      this.changesBunch = {}
      setTimeout(() => {
        let changes = this.changesBunch
        delete this.changesBunch
        for (let listener of this.listeners) {
          listener(this, changes)
        }
      })
    }
    this.changesBunch[key] = value
  }

  changeKey (key, value) {
    if (this[key] === value) return
    this[key] = value
    this.notifyListener(key, value)
  }
}

if (process.env.NODE_ENV !== 'production') {
  RemoteStore.prototype.changeKey = function (key, value) {
    if (this[key] === value) return
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      writable: false,
      value
    })
    this.notifyListener(key, value)
  }
}

module.exports = { RemoteStore }
