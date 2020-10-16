let { checkStore } = require('../check-store')

function initLocalStore (client, StoreClass, listener) {
  if (process.env.NODE_ENV !== 'production') {
    checkStore(StoreClass, 'initLocalStore')
  }
  let instance = client.objects.get(StoreClass)
  if (!instance) {
    instance = new StoreClass(client)
    client.objects.set(StoreClass, instance)
  }

  instance.listeners += 1
  let unbind = instance.emitter.on('change', listener)
  listener(instance)

  return () => {
    unbind()
    instance.listeners -= 1
    if (instance.listeners === 0) {
      client.objects.delete(StoreClass)
      if (instance.destroy) instance.destroy()
    }
  }
}

module.exports = { initLocalStore }
