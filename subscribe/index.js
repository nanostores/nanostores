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

  listener(instance)

  instance.listeners += 1
  let unbind = instance.emitter.on('change', listener)
  return () => {
    unbind()
    instance.listeners -= 1
    if (instance.listeners === 0) {
      instance.client.objects.delete(id || StoreClass)
      if (instance.destroy) instance.destroy()
    }
  }
}

module.exports = { subscribe }
