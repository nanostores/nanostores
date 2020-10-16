let { Model } = require('../model')

class LocalModel extends Model {}
LocalModel.local = true

module.exports = { LocalModel }
