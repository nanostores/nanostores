const START = 0
const STOP = 1
const SET = 2
const NOTIFY = 3
const REVERT_MUTATION = 10

let on = (store, listener, eventKey, mutateStore) => {
  store.events = store.events || {}
  if (!store.events[eventKey + REVERT_MUTATION]) {
    store.events[eventKey + REVERT_MUTATION] = mutateStore(eventProps => {
      let shared = {}
      for (let l of store.events[eventKey]) {
        l({ shared, ...eventProps })
      }
    })
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

export let onStart = (store, listener) =>
  on(store, listener, START, runListeners => {
    let originListen = store.listen
    store.listen = arg => {
      if (!store.lc) runListeners()
      return originListen(arg)
    }
    return () => {
      store.listen = originListen
    }
  })

export let onStop = (store, listener) =>
  on(store, listener, STOP, runListeners => {
    let originOff = store.off
    store.off = () => {
      runListeners()
      return originOff()
    }
    return () => {
      store.off = originOff
    }
  })

export let onSet = (store, listener) =>
  on(store, listener, SET, runListeners => {
    let originSet = store.set
    let originSetKey = store.setKey
    store.set = newValue => {
      let isAborted
      let abort = () => {
        isAborted = true
      }

      runListeners({ abort, newValue })
      if (!isAborted) return originSet(newValue)
    }
    if (store.setKey) {
      store.setKey = (changed, newValue) => {
        let isAborted
        let abort = () => {
          isAborted = true
        }

        runListeners({ abort, changed, newValue })
        if (!isAborted) return originSetKey(changed, newValue)
      }
    }
    return () => {
      store.set = originSet
      store.setKey = originSetKey
    }
  })

export let onNotify = (store, listener) =>
  on(store, listener, NOTIFY, runListeners => {
    let originNotify = store.notify
    store.notify = changed => {
      let isAborted
      let abort = () => {
        isAborted = true
      }

      runListeners({ abort, changed })
      if (!isAborted) return originNotify(changed)
    }
    return () => {
      store.notify = originNotify
    }
  })
