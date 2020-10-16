let { Store } = require('../store')

class Model extends Store {
  constructor (client, id) {
    super(client)
    this.id = id
  }
}

Model.withId = true

module.exports = { Model }
