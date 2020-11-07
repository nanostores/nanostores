let { createContext, useContext, useState, useEffect } = require('react')

let { checkStore } = require('../check-store')

let ClientContext = createContext()

function useStore (StoreClass, id) {
  let client = useContext(ClientContext)
  let rerender = useState({})
  let [isLoading, setLoading] = useState(true)

  if (process.env.NODE_ENV !== 'production') {
    if (!client) {
      throw new Error(
        'Could not find storeon context value.' +
          'Please ensure the component is wrapped in a <ClientContext.Provider>'
      )
    }
    checkStore(StoreClass, id)
  }

  let key = id || StoreClass

  let instance = client.objects.get(key)
  if (!instance) {
    instance = new StoreClass(client, id)
    client.objects.set(key, instance)
  }

  useEffect(() => {
    setLoading(true)
    instance.listeners += 1
    let unbind
    if (instance.modelLoaded === false) {
      instance.modelLoading.then(() => {
        unbind = instance.emitter.on('change', () => {
          rerender[1]({})
        })
        setLoading(false)
      })
    } else {
      unbind = instance.emitter.on('change', () => {
        rerender[1]({})
      })
    }
    return () => {
      if (unbind) unbind()
      instance.listeners -= 1
      if (instance.listeners === 0) {
        setTimeout(() => {
          if (instance.listeners === 0 && client.objects.has(key)) {
            client.objects.delete(key)
            if (instance.destroy) instance.destroy()
          }
        }, 10)
      }
    }
  }, [StoreClass, id])

  if (instance.modelLoading) {
    return [isLoading, instance]
  } else {
    return instance
  }
}

module.exports = { ClientContext, useStore }
