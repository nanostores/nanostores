let { initLocalStore } = require('./init-local-store')
let { initLocalModel } = require('./init-local-model')
let { LocalStore } = require('./local-store')
let { LocalModel } = require('./local-model')
let { Model } = require('./model')
let { Store } = require('./store')

module.exports = {
  initLocalStore,
  initLocalModel,
  LocalStore,
  LocalModel,
  Model,
  Store
}
