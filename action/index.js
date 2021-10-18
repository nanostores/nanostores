import { startTask } from '../task/index.js'

export let lastAction = Symbol()

let doAction = (store, actionName, cb, args) => {
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
    let endTask = startTask()
    return result.finally(endTask)
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
