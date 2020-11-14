let { loading, emitter, listeners, destroy } = require('../symbols')

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

  let unbind = instance[emitter].on('change', listener)
  listener(instance)

  instance[listeners] += 1
  return () => {
    unbind()
    instance[listeners] -= 1
    if (!instance[listeners]) {
      client.objects.delete(StoreClass)
      if (instance[destroy]) instance[destroy]()
    }
  }
}

module.exports = { createLocalStore }
