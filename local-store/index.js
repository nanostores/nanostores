let { Store } = require('../store')

class LocalStore extends Store {}
LocalStore.local = true

module.exports = { LocalStore }
