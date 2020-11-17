let { loading, loaded, emitter, listeners, destroy } = require('../symbols')

function loadRemoteStore (client, StoreClass, id, listener, onChannelError) {
  if (process.env.NODE_ENV !== 'production') {
    if (!onChannelError) {
      throw new Error(
        'Every loadRemoteStore() call should have onChannelError callback ' +
          'to process Not Found and Access Denied error'
      )
    }
  }
  let instance = client.objects.get(id)
  if (!instance) {
    instance = new StoreClass(client, id)
    if (process.env.NODE_ENV !== 'production') {
      if (!instance[loading]) {
        throw new Error(
          `${StoreClass.name} is a local store and should be created ` +
            'with createLocalStore()'
        )
      }
    }
    client.objects.set(id, instance)
  }

  let unbind
  if (instance[loaded]) {
    unbind = instance[emitter].on('change', listener)
    listener(instance)
  } else {
    instance[loading]
      .then(() => {
        unbind = instance[emitter].on('change', listener)
        listener(instance)
      })
      .catch(onChannelError)
  }

  instance[listeners] += 1
  return () => {
    if (unbind) unbind()
    instance[listeners] -= 1
    if (!instance[listeners]) {
      client.objects.delete(id)
      if (instance[destroy]) instance[destroy]()
    }
  }
}

module.exports = { loadRemoteStore }
