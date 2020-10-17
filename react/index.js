let { createContext, useContext, useState, useEffect } = require('react')

let { checkStore } = require('../check-store')

let ClientContext = createContext()

function useStore (StoreClass, id) {
  let client = useContext(ClientContext)
  let rerender = useState({})

  if (process.env.NODE_ENV !== 'production') {
    if (!client) {
      throw new Error(
        'Could not find storeon context value.' +
          'Please ensure the component is wrapped in a <ClientContext.Provider>'
      )
    }
    checkStore(StoreClass, id)
  }

  let instance = client.objects.get(id || StoreClass)
  if (!instance) {
    instance = new StoreClass(client, id)
    client.objects.set(id || StoreClass, instance)
  }

  useEffect(() => {
    instance.listeners += 1
    let unbind = instance.emitter.on('change', () => {
      rerender[1]({})
    })
    return () => {
      unbind()
      instance.listeners -= 1
      if (instance.listeners === 0) {
        instance.client.objects.delete(id || StoreClass)
        if (instance.destroy) instance.destroy()
      }
    }
  }, [StoreClass, id])

  return instance
}

module.exports = { ClientContext, useStore }
