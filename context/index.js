let contexts = new Map()

let _createContext = name => {
  let context = {
    // store [c]opies
    c: new Map(),
    n: name,
    // listener [q]ueue
    q: [],
    // store [s]tates
    s: new Map()
  }
  contexts.set(name, context)
  return context
}
export let globalContext = _createContext()
export let createContext = name => {
  // global context is [d]ead
  globalContext.d = true
  return _createContext(name)
}
export let resetContext = name => {
  if (name) {
    contexts.delete(name)
  } else {
    contexts.clear()
    globalContext.d = false
    delete globalContext.ta
  }
}
export let getContext = name => contexts.get(name)

// lazily initialize store state in context
export function getStoreState(thisStore, originalStore) {
  if (thisStore.ctx.d) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `You can't mix global context and custom contexts, that is probably an error. ` +
          'Please, pass the correct context into `withContext`.'
      )
    }
    // eslint-disable-next-line no-throw-literal
    throw 0
  }

  let state = thisStore.ctx.s.get(originalStore)
  if (!state) {
    state = {
      // [l]isteners [c]ount
      lc: 0,
      // [l]isteners
      ls: [],
      // [v]alue
      v: thisStore.iv
    }
    thisStore.ctx.s.set(originalStore, state)
  }
  return state
}

function shallowClone(obj) {
  return Object.create(
    Object.getPrototypeOf(obj),
    Object.getOwnPropertyDescriptors(obj)
  )
}

export const withContext = (store, ctx) => {
  if (store.ctx === ctx) return store

  let cloned = ctx.c.get(store)
  if (!cloned) {
    cloned = shallowClone(store)
    cloned.ctx = ctx
    if (store.events) cloned.events = shallowClone(store.events)
    ctx.c.set(store, cloned)
  }

  return cloned
}

export const ensureTaskContext = ctx => {
  // [ta]asks — special context/space for all tasks-related things
  if (!ctx.ta) {
    // [i]d, [r]esolves, [t]asks
    ctx.ta = { i: 0, r: [], t: 0 }
  }
  return ctx.ta
}
