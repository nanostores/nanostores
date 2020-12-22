let { loading, subscribe } = require('../store')

function createLocalStore (client, StoreClass, listener) {
  let instance = client.objects.get(StoreClass)
  if (!instance) {
    instance = new StoreClass(client)
    if (process.env.NODE_ENV !== 'production') {
      if (instance[loading]) {
        throw new Error(
          `${StoreClass.name} is a remote store and should be loaded ` +
            'with loadRemoteStore()'
        )
      }
    }
    client.objects.set(StoreClass, instance)
  }

  let unbind = instance[subscribe](listener)
  listener(instance)
  return unbind
}

module.exports = { createLocalStore }
