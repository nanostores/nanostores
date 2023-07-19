import { clean } from '../clean-stores/index.js'
import { withContext } from '../context/index.js'

const START = 0
const STOP = 1
const SET = 2
const NOTIFY = 3
const MOUNT = 5
const UNMOUNT = 6
const ACTION = 7
const REVERT_MUTATION = 10

function makeCtx(obj) {
  return { ctx: s => withContext(s, obj.ctx) }
}

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
    $store.listen = function (arg) {
      if (!this.lc && !this.starting) {
        // Instead of using the global store, we use the cloned version
        this.starting = true
        runListeners(makeCtx(this))
        delete this.starting
      }
      return originListen.call(this, arg)
    }
    return () => {
      $store.listen = originListen
    }
  })

export let onStop = ($store, listener) =>
  on($store, listener, STOP, runListeners => {
    let originOff = $store.off
    $store.off = function () {
      runListeners(makeCtx(this))
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
      $store.setKey = function (changed, changedValue) {
        let isAborted
        let abort = () => {
          isAborted = true
        }

        runListeners({
          abort,
          changed,
          ...makeCtx(this.ctx),
          newValue: {
            ...this.value,
            [changed]: changedValue
          }
        })
        if (!isAborted) return originSetKey.call(this, changed, changedValue)
      }
    }
    $store.set = function (newValue) {
      let isAborted
      let abort = () => {
        isAborted = true
      }

      runListeners({ abort, newValue, ...makeCtx(this.ctx) })
      if (!isAborted) return originSet.call(this, newValue)
    }
    return () => {
      $store.set = originSet
      $store.setKey = originSetKey
    }
  })

export let onNotify = ($store, listener) =>
  on($store, listener, NOTIFY, runListeners => {
    let originNotify = $store.notify
    $store.notify = function (changed) {
      let isAborted
      let abort = () => {
        isAborted = true
      }

      runListeners({ abort, changed, ...makeCtx(this.ctx) })
      if (!isAborted) return originNotify.call(this, changed)
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
    $store.listen = function (...args) {
      if (!this.lc && !this.active) {
        this.active = true
        runListeners(makeCtx(this))
      }
      return originListen.apply(this, args)
    }

    let originOff = $store.off
    $store.events[UNMOUNT] = []
    $store.off = function () {
      originOff()?.call(this)
      setTimeout(() => {
        if (this.active && !this.lc) {
          this.active = false
          for (let destroy of this.events[UNMOUNT]) destroy()
          this.events[UNMOUNT] = []
        }
      }, STORE_UNMOUNT_DELAY)
    }

    if (process.env.NODE_ENV !== 'production') {
      let originClean = $store[clean]
      $store[clean] = function () {
        for (let destroy of this.events[UNMOUNT]) destroy()
        this.events[UNMOUNT] = []
        this.active = false
        originClean.call(this)
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
    $store.action = function (id, actionName, args) {
      runListeners({
        actionName,
        args,
        id,
        ...makeCtx(this),
        onEnd: l => {
          ;(endListeners[id] || (endListeners[id] = [])).push(l)
        },
        onError: l => {
          ;(errorListeners[id] || (errorListeners[id] = [])).push(l)
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
