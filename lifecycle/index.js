import { _options } from '../spred'

const START = 0
const STOP = 1
const SET = 2
const NOTIFY = 3
const MOUNT = 5
const UNMOUNT = 6
const REVERT_MUTATION = 10

export let on = (object, listener, eventKey, mutateStore) => {
  if (!object[_options]) object[_options] = {}
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
    let originOnActivate = $store[_options].onActivate
    let active = true

    $store[_options].onActivate = function (value) {
      originOnActivate?.call(this, value)
      if (active) runListeners()
    }

    return () => {
      active = false
    }
  })

export let onStop = ($store, listener) =>
  on($store, listener, STOP, runListeners => {
    let originOnDeactivate = $store[_options].onDeactivate
    let active = true

    $store[_options].onDeactivate = function (value) {
      originOnDeactivate?.call(this, value)
      if (active) runListeners()
    }

    return () => {
      active = false
    }
  })

const createUpdateHandler = $store => runListeners => {
  let originOnUpdate = $store[_options].onUpdate
  let active = true

  $store[_options].onUpdate = function (value, prevValue) {
    originOnUpdate?.call(this, value, prevValue)
    if (active) runListeners({ newValue: value, oldValue: prevValue })
  }

  return () => {
    active = false
  }
}

export let onSet = ($store, listener) =>
  on($store, listener, SET, createUpdateHandler($store))

export let onNotify = ($store, listener) =>
  on($store, listener, NOTIFY, createUpdateHandler($store))

export let STORE_UNMOUNT_DELAY = 1000

export let onMount = ($store, initialize) => {
  let listener = payload => {
    let destroy = initialize(payload)
    if (destroy) {
      if (!$store.events[UNMOUNT]) $store.events[UNMOUNT] = []
      $store.events[UNMOUNT].push(destroy)
    }
  }

  return on($store, listener, MOUNT, runListeners => {
    let originOnActivate = $store[_options].onActivate
    let originOnDeactivate = $store[_options].onDeactivate
    let active = true

    $store[_options].onActivate = function (value) {
      originOnActivate?.call(this, value)
      if (active) runListeners()
    }

    $store[_options].onDeactivate = function (value) {
      originOnDeactivate?.call(this, value)
      if (active) {
        for (let destroy of $store.events[UNMOUNT] || []) destroy()
        $store.events[UNMOUNT] = []
      }
    }

    return () => {
      active = false
    }
  })
}
