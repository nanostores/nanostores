import { clean } from '../clean-stores/index.js'

const START = 0
const STOP = 1
const SET = 2
const NOTIFY = 3
const MOUNT = 5
const UNMOUNT = 6
const ACTION = 7
const REVERT_MUTATION = 10

export let on = (object, listener, eventKey, mutateStore) => {
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

export let onStart = ($store, listener) =>
  on($store, listener, START, runListeners => {
    let originListen = $store.listen
    $store.listen = arg => {
      if (!$store.lc && !$store.starting) {
        $store.starting = true
        runListeners()
        delete $store.starting
      }
      return originListen(arg)
    }
    return () => {
      $store.listen = originListen
    }
  })

export let onStop = ($store, listener) =>
  on($store, listener, STOP, runListeners => {
    let originOff = $store.off
    $store.off = () => {
      runListeners()
      originOff()
    }
    return () => {
      $store.off = originOff
    }
  })

export let onSet = ($store, listener) =>
  on($store, listener, SET, runListeners => {
    let originSet = $store.set
    let originSetKey = $store.setKey
    if ($store.setKey) {
      $store.setKey = (changed, changedValue) => {
        let isAborted
        let abort = () => {
          isAborted = true
        }

        runListeners({
          abort,
          changed,
          newValue: { ...$store.value, [changed]: changedValue }
        })
        if (!isAborted) return originSetKey(changed, changedValue)
      }
    }
    $store.set = newValue => {
      let isAborted
      let abort = () => {
        isAborted = true
      }

      runListeners({ abort, newValue })
      if (!isAborted) return originSet(newValue)
    }
    return () => {
      $store.set = originSet
      $store.setKey = originSetKey
    }
  })

export let onNotify = ($store, listener) =>
  on($store, listener, NOTIFY, runListeners => {
    let originNotify = $store.notify
    $store.notify = changed => {
      let isAborted
      let abort = () => {
        isAborted = true
      }

      runListeners({ abort, changed })
      if (!isAborted) return originNotify(changed)
    }
    return () => {
      $store.notify = originNotify
    }
  })

export let STORE_UNMOUNT_DELAY = 1000

export let onMount = ($store, initialize) => {
  let listener = payload => {
    let destroy = initialize(payload)
    if (destroy) $store.events[UNMOUNT].push(destroy)
  }
  return on($store, listener, MOUNT, runListeners => {
    let originListen = $store.listen
    $store.listen = (...args) => {
      if (!$store.lc && !$store.active) {
        $store.active = true
        runListeners()
      }
      return originListen(...args)
    }

    let originOff = $store.off
    $store.events[UNMOUNT] = []
    $store.off = () => {
      originOff()
      setTimeout(() => {
        if ($store.active && !$store.lc) {
          $store.active = false
          for (let destroy of $store.events[UNMOUNT]) destroy()
          $store.events[UNMOUNT] = []
        }
      }, STORE_UNMOUNT_DELAY)
    }

    if (process.env.NODE_ENV !== 'production') {
      let originClean = $store[clean]
      $store[clean] = () => {
        for (let destroy of $store.events[UNMOUNT]) destroy()
        $store.events[UNMOUNT] = []
        $store.active = false
        originClean()
      }
    }

    return () => {
      $store.listen = originListen
      $store.off = originOff
    }
  })
}


export let onAction = ($store, listener) =>
  on($store, listener, ACTION, runListeners => {
    let errorListeners = {}
    let endListeners = {}
    let originAction = $store.action
    $store.action = (id, actionName, args) => {
      runListeners({
        actionName,
        args,
        id,
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
      $store.action = originAction
    }
  })
