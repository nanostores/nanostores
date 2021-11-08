import { startTask } from '../task/index.js'

export let lastAction = Symbol()
export let actionId = Symbol()

let uid = 0

let doAction = (store, actionName, cb, args) => {
  let id = ++uid
  let tracker = { ...store }
  tracker.set = (...setArgs) => {
    store[lastAction] = actionName
    store[actionId] = id
    store.set(...setArgs)
    delete store[lastAction]
    delete store[actionId]
  }
  if (store.setKey) {
    tracker.setKey = (...setArgs) => {
      store[lastAction] = actionName
      store[actionId] = id
      store.setKey(...setArgs)
      delete store[lastAction]
      delete store[actionId]
    }
  }
  let result = cb(tracker, ...args)
  if (result instanceof Promise) {
    if (typeof store.action !== 'undefined') {
      store.action(id, actionName, args)
    }
    let endTask = startTask()
    return result
      .catch(error => {
        if (typeof store.error !== 'undefined') {
          store.error(id, error)
        }
        throw error
      })
      .finally(() => {
        endTask()
        if (typeof store.end !== 'undefined') {
          store.end(id)
        }
      })
  }
  return result
}

export let action =
  (store, actionName, cb) =>
  (...args) =>
    doAction(store, actionName, cb, args)

export let actionFor = (Template, actionName, cb) => {
  return (store, ...rest) => doAction(store, actionName, cb, rest)
}
