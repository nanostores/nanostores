import { startTask } from '../task/index.js'

export let lastAction = Symbol()

let doAction = (store, actionName, cb, args) => {
  let session = { ...store }
  session.set = (...fnArgs) => {
    store[lastAction] = actionName
    store.set(...fnArgs)
  }
  if (store.setKey) {
    session.setKey = (...fnArgs) => {
      store[lastAction] = actionName
      store.setKey(...fnArgs)
    }
  }
  let result = cb(session, ...args)
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
  return (store, ...rest) => {
    doAction(store, actionName, cb, rest)
  }
}
