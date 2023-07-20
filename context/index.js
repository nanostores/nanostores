let contexts = new Map()

// private object retains its id throught
let ctxTrait = {}

export function isContext(ctx) {
  return ctx?._ === ctxTrait
}

function buildContext(id, storeStates = {}) {
  let context = {
    _: ctxTrait,
    // store copies
    copies: new Map(),
    id,
    // listener [q]ueue
    q: [],
    // store states
    states: storeStates
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
    delete globalContext.tasks
  }
}
export function getContext(id) {
  return contexts.get(id)
}
export function serializeContext(id) {
  return JSON.stringify(contexts.get(id).states)
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
    throw new Error('no global ctx')
  }

  let state = thisStore.ctx.states[originalStore.id]
  if (!state) {
    state = {
      // [l]isteners [c]ount
      lc: 0,
      // [l]isteners
      ls: [],
      // [v]alue
      v: thisStore.iv
    }
    thisStore.ctx.states[originalStore.id] = state
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

  let cloned = ctx.copies.get(store)
  if (!cloned) {
    cloned = shallowClone(store)
    cloned.ctx = ctx
    ctx.copies.set(store, cloned)
  }

  return cloned
}

export function ensureTaskContext(ctx) {
  if (!ctx.tasks) {
    ctx.tasks = { endListen: {}, errListen: {}, id: 0, resolves: [], tasks: 0 }
  }
  return ctx.tasks
}

export function makeCtx(obj) {
  return { ctx: s => withContext(s, obj.ctx) }
}
