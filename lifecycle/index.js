const getOrCreate = (dest, key, getValue) => {
  if (!dest.has(key)) dest.set(key, getValue())
  return dest.get(key)
}

export const container = new Map()

const on = (store, pluginHandler, eventKey, eventHandler) => {
  let storeContainer = getOrCreate(container, store, () => new Map())
  getOrCreate(storeContainer, `${eventKey}-d`, () =>
    eventHandler(store, (original, methods) => {
      storeContainer.get(eventKey).reduceRight((shared, h) => {
        h({ original, shared, ...methods })
        return shared
      }, {})
    })
  )
  getOrCreate(storeContainer, eventKey, () => []).push(pluginHandler)
  return () => {
    let current = storeContainer.get(eventKey)
    let index = current.indexOf(pluginHandler)
    current.splice(index, 1)
    if (!current.length) {
      storeContainer.delete(eventKey)
      storeContainer.get(`${eventKey}-d`)()
      storeContainer.delete(`${eventKey}-d`)
    }
    if (!storeContainer.size) container.delete(store)
  }
}

export const onStart = (destStore, cb) =>
  on(destStore, cb, 'create', (store, handler) => {
    let method = store.listen.bind(store)
    store.listen = (...original) => {
      if (!store.lc) handler(original)
      return method(...original)
    }
    return () => (store.listen = method)
  })

export const onStop = (destStore, cb) =>
  on(destStore, cb, 'stop', (store, handler) => {
    let method = store.off.bind(store)
    store.off = (...original) => {
      handler(original)
      return method(...original)
    }
    return () => (store.off = method)
  })

export const onSet = (destStore, cb) =>
  on(destStore, cb, 'set', (store, handler) => {
    let method = store.set.bind(store)
    store.set = (...original) => {
      let isAborted
      let abort = () => (isAborted = true)

      handler(original, { abort })
      if (!isAborted) return method(...original)
    }
    return () => (store.set = method)
  })

export const onNotify = (destStore, cb) =>
  on(destStore, cb, 'notify', (store, handler) => {
    let method = store.notify.bind(store)
    store.notify = (...original) => {
      let isAborted
      let abort = () => (isAborted = true)

      handler(original, { abort })
      if (!isAborted) return method(...original)
    }
    return () => (store.notify = method)
  })
