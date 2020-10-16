let { checkStore } = require('../check-store')

function initLocalModel (client, ModelClass, id, listener) {
  if (process.env.NODE_ENV !== 'production') {
    checkStore(ModelClass, 'initLocalModel', id)
  }
  if (!id.startsWith(ModelClass.storeName + ':')) {
    id = ModelClass.storeName + ':' + id
  }
  let instance = client.objects.get(id)
  if (!instance) {
    instance = new ModelClass(client, id)
    client.objects.set(id, instance)
  }

  instance.listeners += 1
  let unbind = instance.emitter.on('change', listener)
  listener(instance)

  return () => {
    unbind()
    instance.listeners -= 1
    if (instance.listeners === 0) {
      client.objects.delete(id)
      if (instance.destroy) instance.destroy()
    }
  }
}

module.exports = { initLocalModel }
