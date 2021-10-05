export let lastAction = Symbol()

let doAction = (store, actionName, cb, args) => {
  store[lastAction] = actionName
  let res = cb(...args)
  return res
}

export let action =
  (store, actionName, cb) =>
  (...params) =>
    doAction(store, actionName, cb, params)

export let actionFor = (Builder, actionName, cb) => {
  return (...args) => doAction(args[0], actionName, cb, args)
}
