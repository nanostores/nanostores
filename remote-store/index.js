let loading
if (process.env.NODE_ENV === 'production') {
  loading = Symbol()
} else {
  loading = Symbol('loading')
}

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

  changeKey (key, value, swallow) {
    if (this[key] === value) return
    this[key] = value
    if (!swallow) {
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
  }
}

if (process.env.NODE_ENV !== 'production') {
  RemoteStore.prototype.changeKey = function (key, value, swallow) {
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
          let changes = this.changesBunch
          delete this.changesBunch
          for (let listener of this.listeners) {
            listener(this, changes)
          }
        })
      }
      this.changesBunch[key] = value
    }
  }
}

module.exports = {
  RemoteStore,
  loading
}
