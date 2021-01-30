import { LocalStore } from '../local-store/index.js'

class SimpleLocalStore extends LocalStore {
  set (value) {
    this.changeKey('value', value)
  }
}

export function local (initial, init) {
  class Store extends SimpleLocalStore {
    constructor () {
      super()
      this.value = initial
      if (init) this.destroy = init(this)
    }
  }
  return Store
}
