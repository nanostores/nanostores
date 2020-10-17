let { Store } = require('../store')

class Model extends Store {}

Model.withId = true

module.exports = { Model }
