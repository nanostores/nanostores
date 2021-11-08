import { clean } from '../clean-stores/index.js'

const START = 0
const STOP = 1
const SET = 2
const NOTIFY = 3
const BUILD = 4
const ACTION = 5
const REVERT_MUTATION = 10

let on = (object, listener, eventKey, mutateStore) => {
  object.events = object.events || {}
  if (!object.events[eventKey + REVERT_MUTATION]) {
    object.events[eventKey + REVERT_MUTATION] = mutateStore(eventProps => {
      // eslint-disable-next-line no-sequences
      object.events[eventKey].reduceRight((event, l) => (l(event), event), {
        shared: {},
        ...eventProps
      })
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
      originOff()
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
    }
    store.set = newValue => {
      let isAborted
      let abort = () => {
        isAborted = true
      }

      runListeners({ abort, newValue })
      if (!isAborted) return originSet(newValue)
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

export let onBuild = (Template, listener) =>
  on(Template, listener, BUILD, runListeners => {
    let originBuild = Template.build
    Template.build = (...args) => {
      let store = originBuild(...args)
      runListeners({ store })
      return store
    }
    return () => {
      Template.build = originBuild
    }
  })

export let STORE_UNMOUNT_DELAY = 1000

export let onMount = (store, initialize) => {
  let destroy
  let unbindStart = onStart(store, () => {
    if (!store.active) {
      destroy = initialize()
      store.active = true
    }
  })
  let unbindStop = onStop(store, () => {
    setTimeout(() => {
      if (store.active && !store.lc) {
        if (destroy) destroy()
        destroy = undefined
        store.active = false
      }
    }, STORE_UNMOUNT_DELAY)
  })

  if (process.env.NODE_ENV !== 'production') {
    let originClean = store[clean]
    store[clean] = () => {
      if (destroy) destroy()
      destroy = undefined
      store.active = false
      originClean()
    }
  }
  return () => {
    unbindStart()
    unbindStop()
  }
}


export let onAction = (store, listener) =>
  on(store, listener, ACTION, runListeners => {
    let errorListeners = {}
    let endListeners = {}
    let originAction = store.action
    store.action = (id, actionName, args) => {
      runListeners({
        id,
        actionName,
        args,
        onEnd: l => {
          (endListeners[id] || (endListeners[id] = [])).push(l)
        },
        onError: l => {
          (errorListeners[id] || (errorListeners[id] = [])).push(l)
        }
      })
      return [
        error => {
          if (errorListeners[id]) {
            for (let l of errorListeners[id]) l({ error })
          }
        },
        () => {
          if (endListeners[id]) {
            for (let l of endListeners[id]) l()
            delete errorListeners[id]
            delete endListeners[id]
          }
        }
      ]
    }
    return () => {
      store.action = originAction
    }
  })
