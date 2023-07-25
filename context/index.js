let contexts = []

// private object retains its id throught the lifetime
let GLOBAL_CONTEXT_TRAIT = 1
let GLOBAL_CUSTOM_CONTEXT_TRAIT = 2
let LOCAL_CONTEXT_TRAIT = 3

export function isContext(ctx) {
  return !!ctx?.t
}

function buildContext(contextType = GLOBAL_CONTEXT_TRAIT, storeStates = {}) {
  let context = {
    // store copies
    copies: new Map(),
    // nested contexts
    nested: {},
    // listener [q]ueue
    q: [],
    // store states
    states: storeStates,
    t: contextType
  }
  contexts.push(context)
  return context
}

export const globalContext = buildContext()

export function createContext(storeStates) {
  return buildContext(GLOBAL_CUSTOM_CONTEXT_TRAIT, storeStates)
}

export function createLocalContext(parentContext, id, storeStates) {
  let cached = parentContext.nested[id]
  if (cached) return cached

  let ctx = buildContext(LOCAL_CONTEXT_TRAIT, storeStates)
  parentContext.nested[id] = ctx
  ctx.parent = parentContext
  return ctx
}

export function resetContext(context) {
  if (context) {
    contexts = contexts.filter(c => context !== c)
  } else {
    contexts = []
    delete globalContext.tasks
  }
}
export function serializeContext(context) {
  return JSON.stringify(context.states)
}

// lazily initialize store state in context
export function getStoreState(thisStore, originalStore) {
  let ctxFromTree = traverseContexts(originalStore, thisStore.ctx)
  syncAtomTrait(originalStore, ctxFromTree)

  let state = ctxFromTree.states[originalStore.id]
  if (!state) {
    state = {
      // [l]isteners [c]ount
      lc: 0,
      // [l]isteners
      ls: [],
      // [v]alue
      v: thisStore.iv
    }
    ctxFromTree.states[originalStore.id] = state
  }
  return state
}

function shallowClone(obj) {
  let clone = Object.create(
    Object.getPrototypeOf(obj),
    Object.getOwnPropertyDescriptors(obj)
  )
  for (let key in clone) {
    let descriptor = Object.getOwnPropertyDescriptor(clone, key)
    // Skipping getters
    if (descriptor.get) continue

    if (typeof clone[key] === 'function') {
      clone[key] = clone[key].bind(clone)
    }
  }
  return clone
}

function syncAtomTrait(store, ctx) {
  if (!store.t) {
    store.t = ctx.t
  }
}
let incorrectAtomTreeErr = new Error('Incorrect atom tree')
function traverseContexts(store, ctx) {
  if (store.t > ctx.t) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `You're trying to access an atom tied to a custom context using ` +
          `a global context. That's probably unintended and can lead to bugs.`
      )
    }
    throw incorrectAtomTreeErr
  }

  // Fast global context access
  if (store.ctx === ctx) {
    return ctx
  }
  // First run of a store that has never run against a context before
  if (!store.t) {
    return ctx
  }

  // We switch equal contexts, like custom -> custom, or local -> local
  if (store.t === ctx.t) {
    return ctx
  }

  // We try to invoke a store with a context nested deep in the context tree,
  // like custom (this store) -> local -> local -> ctx.
  let { parent } = ctx
  if (parent) {
    return traverseContexts(store, parent)
  } else {
    if (process.env.NODE_ENV !== 'production') {
      function getType(type) {
        return type === GLOBAL_CONTEXT_TRAIT ? 'global' : 'custom'
      }

      throw new Error(
        `You're trying to get access to an atom using a context which doesn't ` +
          `belong to this atom's tree of contexts. The atom has ${getType(
            store.ctx.t
          )} type, while you're trying to use ${getType(ctx.t)} context.`
      )
    }
    throw incorrectAtomTreeErr
  }
}

export function withContext(storeOrAction, ctx) {
  let cloned
  let correctCtx = ctx

  if (isContext(storeOrAction.ctx)) {
    correctCtx = traverseContexts(storeOrAction, ctx)

    syncAtomTrait(storeOrAction, correctCtx)
    if (storeOrAction.ctx === correctCtx) return storeOrAction

    cloned = correctCtx.copies.get(storeOrAction) || shallowClone(storeOrAction)
    cloned.ctx = correctCtx
  } else {
    // It's actually an action
    cloned =
      ctx.copies.get(storeOrAction) ||
      ((...args) => storeOrAction(...args, ctx))
  }

  correctCtx.copies.set(storeOrAction, cloned)

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
