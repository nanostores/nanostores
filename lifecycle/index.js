const getOrCreate = (dest, key, payload = {}) => {
  if (!dest.has(key)) dest.set(key, payload)
  return dest.get(key)
}

const adaptersStorage = new Map()
const listenersStorage = new Map()

const lifecycle = (store, eventKey, creator, bind) => {
  let listenerContainer = getOrCreate(listenersStorage, store)
  let adapterContainer = getOrCreate(adaptersStorage, store)

  if (!adapterContainer[eventKey]) {
    let adapterDirector = (key, original, methods) => {
      listenerContainer[key].reduceRight((shared, h) => {
        h({ original, shared, ...methods })
        return shared
      }, {})
    }
    creator(store, adapterDirector.bind(null, eventKey))
    adapterContainer[eventKey] = eventKey
  }

  return bind(listenerContainer)
}

const on = (store, handler, key, eventHandler) =>
  lifecycle(store, key, eventHandler, listenerContainer => {
    if (!listenerContainer[key]) {
      listenerContainer[key] = []
    }
    listenerContainer[key].push(handler)
    return () => {
      let index = listenerContainer[key].indexOf(handler)
      listenerContainer[key].splice(index, 1)
    }
  })

export const onCreate = (destStore, cb) =>
  on(destStore, cb, 'create', (store, handler) => {
    let orig = store.listen.bind(store)
    store.listen = (...original) => {
      if (!store.lc) handler(original)
      return orig(...original)
    }
  })

export const onStop = (destStore, cb) =>
  on(destStore, cb, 'off', (store, handler) => {
    let orig = store.off.bind(store)
    store.off = (...original) => {
      handler(original)
      return orig(...original)
    }
  })

export const onSet = (destStore, cb) =>
  on(destStore, cb, 'set', (store, handler) => {
    let orig = store.set.bind(store)
    store.set = (...original) => {
      let isAborted
      let abort = () => (isAborted = true)

      handler(original, { abort })
      if (!isAborted) return orig(...original)
    }
  })

export const onChange = (destStore, cb) =>
  on(destStore, cb, 'change', (store, handler) => {
    let orig = store.notify.bind(store)
    store.notify = (...original) => {
      let isAborted
      let abort = () => (isAborted = true)

      handler(original, { abort })
      if (!isAborted) return orig(...original)
    }
  })
