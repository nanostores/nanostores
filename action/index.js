import { startTask } from '../task/index.js'

export let lastAction = Symbol()

let doAction = (store, actionName, cb, args) => {
  store[lastAction] = actionName
  let result = cb(...args)
  if (typeof result === 'object' && result.then) {
    let endTask = startTask()
    return result.finally(endTask)
  }
  return result
}

export let action =
  (store, actionName, cb) =>
  (...params) =>
    doAction(store, actionName, cb, params)

export let actionFor = (Template, actionName, cb) => {
  return (...args) => doAction(args[0], actionName, cb, args)
}
