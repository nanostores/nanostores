let { destroy } = require('../store')

function cleanStores (...StoreClasses) {
  for (let StoreClass of StoreClasses) {
    if (StoreClass.loaded) {
      if (StoreClass.loaded instanceof Map) {
        for (let store of StoreClass.loaded.values()) {
          if (store[destroy]) store[destroy]()
        }
      } else if (StoreClass.loaded[destroy]) {
        StoreClass.loaded[destroy]()
      }
      delete StoreClass.loaded
    }
  }
}

module.exports = { cleanStores }
