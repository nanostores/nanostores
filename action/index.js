import { startTask } from '../task/index.js'

export let lastAction = Symbol()
export let actionId = Symbol()

let uid = 0

export let doAction = (store, actionName, cb, args) => {
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
    let [err, end] =
      typeof store.action !== 'undefined'
        ? store.action(id, actionName, args)
        : []
    let endTask = startTask()
    return result
      .catch(error => {
        err && err(error)
        throw error
      })
      .finally(() => {
        endTask()
        end && end()
      })
  }
  return result
}

export let action =
  (store, actionName, cb) =>
  (...args) =>
    doAction(store, actionName, cb, args)
