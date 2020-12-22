let { loading, loaded, subscribe } = require('../store')

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

  let unbind = instance[subscribe](listener)

  if (instance[loaded]) {
    listener(instance)
  } else {
    instance[loading]
      .then(() => {
        listener(instance)
      })
      .catch(onChannelError)
  }

  return unbind
}

module.exports = { loadRemoteStore }
