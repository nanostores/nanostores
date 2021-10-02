const START = 0
const STOP = 1
const SET = 2
const NOTIFY = 3
const BUILD = 4
const REVERT_MUTATION = 10

let on = (object, listener, eventKey, mutateStore) => {
  object.events = object.events || {}
  if (!object.events[eventKey + REVERT_MUTATION]) {
    object.events[eventKey + REVERT_MUTATION] = mutateStore(eventProps => {
      let event = { shared: {}, ...eventProps }
      for (let l of object.events[eventKey]) l(event)
    })
  }
  object.events[eventKey] = object.events[eventKey] || []
  object.events[eventKey].push(listener)
  return () => {
    let currentListeners = object.events[eventKey]
    let index = currentListeners.indexOf(listener)
    currentListeners.splice(index, 1)
    if (!currentListeners.length) {
      delete object.events[eventKey]
      object.events[eventKey + REVERT_MUTATION]()
      delete object.events[eventKey + REVERT_MUTATION]
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
    if (store.setKey) {
      store.setKey = (changed, changedValue) => {
        let isAborted
        let abort = () => {
          isAborted = true
        }

        runListeners({
          abort,
          changed,
          newValue: { ...store.value, [changed]: changedValue }
        })
        if (!isAborted) return originSetKey(changed, changedValue)
      }
    } else {
      store.set = newValue => {
        let isAborted
        let abort = () => {
          isAborted = true
        }

        runListeners({ abort, newValue })
        if (!isAborted) return originSet(newValue)
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

export let onBuild = (Builder, listener) =>
  on(Builder, listener, BUILD, runListeners => {
    let originBuild = Builder.build
    Builder.build = (...args) => {
      let store = originBuild(...args)
      runListeners({ store })
      return store
    }
    return () => {
      Builder.build = originBuild
    }
  })
