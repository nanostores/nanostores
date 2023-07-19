import { startTask } from '../task/index.js'

export let lastAction = Symbol()
export let actionId = Symbol()

let uid = 0

export let doAction = ($store, actionName, cb, args) => {
  let id = ++uid
  let tracker = { ...$store }
  tracker.set = (...setArgs) => {
    $store[lastAction] = actionName
    $store[actionId] = id
    $store.set(...setArgs)
    delete $store[lastAction]
    delete $store[actionId]
  }
  if ($store.setKey) {
    tracker.setKey = (...setArgs) => {
      $store[lastAction] = actionName
      $store[actionId] = id
      $store.setKey(...setArgs)
      delete $store[lastAction]
      delete $store[actionId]
    }
  }
  let onError, onEnd
  if ($store.action) {
    ;[onError, onEnd] = $store.action(id, actionName, args)
  }
  let result = cb(tracker, ...args)
  if (result instanceof Promise) {
    let endTask = startTask()
    return result
      .catch(error => {
        if (onError) onError(error)
        throw error
      })
      .finally(() => {
        endTask()
        if (onEnd) onEnd()
      })
  }
  if (onEnd) onEnd()
  return result
}

export let action =
  ($store, actionName, cb) =>
  (...args) =>
    doAction($store, actionName, cb, args)
