let contexts = new Map()

let ctxSymbol = Symbol()

export function isContext(ctx) {
  return ctx?._ === ctxSymbol
}

function buildContext(id, storeStates = {}) {
  let context = {
    _: ctxSymbol,
    // store [c]opies
    c: new Map(),
    id,
    // listener [q]ueue
    q: [],
    // store [s]tates
    s: storeStates
  }
  contexts.set(id, context)
  return context
}

let globalContextPolluted = false
export const globalContext = buildContext()

export function createContext(id, storeStates) {
  globalContextPolluted = true
  return buildContext(id, storeStates)
}
export function resetContext(id) {
  if (id) {
    contexts.delete(id)
  } else {
    contexts.clear()
    globalContextPolluted = false
    delete globalContext.ta
  }
}
export function getContext(id) {
  contexts.get(id)
}
export function serializeContext(id) {
  return JSON.stringify(contexts.get(id).s)
}

// lazily initialize store state in context
export function getStoreState(thisStore, originalStore) {
  if (globalContextPolluted && thisStore.ctx === globalContext) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `You can't mix global context and custom contexts, that is probably an error. ` +
          'Please, pass the correct context into `withContext`.'
      )
    }
    // eslint-disable-next-line no-throw-literal
    throw 0
  }

  let state = thisStore.ctx.s[originalStore.id]
  if (!state) {
    state = {
      // [l]isteners [c]ount
      lc: 0,
      // [l]isteners
      ls: [],
      // [v]alue
      v: thisStore.iv
    }
    thisStore.ctx.s[originalStore.id] = state
  }
  return state
}

function shallowClone(obj) {
  return Object.create(
    Object.getPrototypeOf(obj),
    Object.getOwnPropertyDescriptors(obj)
  )
}

export function withContext(store, ctx) {
  if (store.ctx === ctx) return store

  let cloned = ctx.c.get(store)
  if (!cloned) {
    cloned = shallowClone(store)
    cloned.ctx = ctx
    ctx.c.set(store, cloned)
  }

  return cloned
}

export function ensureTaskContext(ctx) {
  // [ta]asks — special context/space for all tasks-related things
  if (!ctx.ta) {
    // [i]d, [r]esolves, [t]asks
    ctx.ta = { endListen: {}, errListen: {}, i: 0, r: [], t: 0 }
  }
  return ctx.ta
}

export function makeCtx(obj) {
  return { ctx: s => withContext(s, obj.ctx) }
}
