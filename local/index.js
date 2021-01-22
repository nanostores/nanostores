let { LocalStore } = require('../local-store')

class SimpleLocalStore extends LocalStore {
  change (value) {
    this.changeKey('value', value)
  }
}

function local (initial, opts = {}) {
  class Store extends SimpleLocalStore {
    constructor () {
      super()
      this.value = initial
      if (opts.init) opts.init(this)
    }
  }
  if (opts.destroy) {
    Store.prototype.destroy = function () {
      opts.destroy(this)
    }
  }
  return Store
}

module.exports = { local }
