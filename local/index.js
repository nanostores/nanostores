let { LocalStore } = require('../local-store')

class SimpleLocalStore extends LocalStore {
  set (value) {
    this.changeKey('value', value)
  }
}

function local (initial, init) {
  class Store extends SimpleLocalStore {
    constructor () {
      super()
      this.value = initial
      if (init) this.destroy = init(this)
    }
  }
  return Store
}

module.exports = { local }
