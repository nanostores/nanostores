let { checkStore } = require('../check-store')

function subscribe (client, StoreClass, id, listener) {
  if (!listener) {
    listener = id
    id = false
  }

  if (process.env.NODE_ENV !== 'production') {
    checkStore(StoreClass, id)
  }

  let instance = client.objects.get(id || StoreClass)
  if (!instance) {
    instance = new StoreClass(client, id || StoreClass)
    client.objects.set(id || StoreClass, instance)
  }

  let unbind
  if (instance.modelLoaded === false) {
    instance.modelLoading.then(() => {
      unbind = instance.emitter.on('change', listener)
      listener(instance)
    })
  } else {
    unbind = instance.emitter.on('change', listener)
    listener(instance)
  }

  instance.listeners += 1
  return () => {
    if (unbind) unbind()
    instance.listeners -= 1
    if (instance.listeners === 0) {
      client.objects.delete(id || StoreClass)
      if (instance.destroy) instance.destroy()
    }
  }
}

module.exports = { subscribe }
