import { startTask } from '../task/index.js'

export let lastAction = Symbol()

let doAction = (store, actionName, cb, args) => {
  let id = Symbol()
  let tracker = { ...store }
  tracker.set = (...setArgs) => {
    store[lastAction] = actionName
    store.set(...setArgs)
    delete store[lastAction]
  }
  if (store.setKey) {
    tracker.setKey = (...setArgs) => {
      store[lastAction] = actionName
      store.setKey(...setArgs)
      delete store[lastAction]
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
