import {
  ensureTaskContext,
  globalContext,
  isContext,
  withContext
} from '../context/index.js'
import { startTask } from '../task/index.js'

export let lastAction = Symbol()
export let actionId = Symbol()

export let doAction = ($$store, actionName, cb, args, ctx = globalContext) => {
  let taskContext = ensureTaskContext(ctx)

  let id = ++taskContext.id
  let $store = withContext($$store, ctx)

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
    let endTask = startTask(ctx)
    return result
      .catch(error => {
        onError?.(error)
        throw error
      })
      .finally(() => {
        endTask()
        onEnd?.()
      })
  }
  onEnd?.()
  return result
}

export let action =
  ($store, actionName, cb) =>
  (...args) => {
    let argsToSpread = [args]
    let possiblyCtx = args[args.length - 1]
    if (isContext(possiblyCtx)) argsToSpread.push(possiblyCtx)

    return doAction($store, actionName, cb, ...argsToSpread)
  }
