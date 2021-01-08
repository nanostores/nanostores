let { connect } = require('../connect')
let { local } = require('../local')

function derived (storeClasses, cb) {
  if (!Array.isArray(storeClasses)) storeClasses = [storeClasses]
  let stores = storeClasses.map(i => i.load())
  return local(undefined, {
    init (store) {
      connect(store, stores, () => ({ value: cb(...stores) }))
    }
  })
}

module.exports = { derived }
