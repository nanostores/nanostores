const START = 0
const STOP = 1
const SET = 2
const NOTIFY = 3
const REVERT_MUTATION = 100

let on = (store, listener, eventKey, mutateStore) => {
  store.events = store.events || {}
  if (!store.events[eventKey + REVERT_MUTATION]) {
    store.events[eventKey + REVERT_MUTATION] = mutateStore(
      store,
      (args, methods) => {
        store.events[eventKey].reduceRight((shared, l) => {
          l({ args, shared, ...methods })
          return shared
        }, {})
      }
    )
  }
  store.events[eventKey] = store.events[eventKey] || []
  store.events[eventKey].push(listener)
  return () => {
    let currentListeners = store.events[eventKey]
    let index = currentListeners.indexOf(listener)
    currentListeners.splice(index, 1)
    if (!currentListeners.length) {
      delete store.events[eventKey]
      store.events[eventKey + REVERT_MUTATION]()
      delete store.events[eventKey + REVERT_MUTATION]
    }
  }
}

export let onStart = (destStore, listener) =>
  on(destStore, listener, START, (store, runListeners) => {
    let originListen = store.listen
    store.listen = (...args) => {
      if (!store.lc) runListeners(args)
      return originListen(...args)
    }
    return () => {
      store.listen = originListen
    }
  })

export let onStop = (destStore, listener) =>
  on(destStore, listener, STOP, (store, runListeners) => {
    let originOff = store.off
    store.off = (...args) => {
      runListeners(args)
      return originOff(...args)
    }
    return () => {
      store.off = originOff
    }
  })

export let onSet = (destStore, listener) =>
  on(destStore, listener, SET, (store, runListeners) => {
    let originSet = store.set
    store.set = (...args) => {
      let isAborted
      let abort = () => {
        isAborted = true
      }

      runListeners(args, { abort })
      if (!isAborted) return originSet(...args)
    }
    return () => {
      store.set = originSet
    }
  })

export let onNotify = (destStore, listener) =>
  on(destStore, listener, NOTIFY, (store, runListeners) => {
    let originNotify = store.notify
    store.notify = (...args) => {
      let isAborted
      let abort = () => {
        isAborted = true
      }

      runListeners(args, { abort })
      if (!isAborted) return originNotify(...args)
    }
    return () => {
      store.notify = originNotify
    }
  })
