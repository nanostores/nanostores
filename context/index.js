let createContext = () => {
  let context = {
    // listener queue
    q: [],
    // store states
    s: new Map()
  }
  return context
}

let context = createContext()

export let getListenerQueue = () => {
  return context.q
}

// lazily initialize store state in context
export let getStoreState = store => {
  let state = context.s.get(store)
  if (!state) {
    state = {
      // listeners count
      lc: 0,
      // listeners
      ls: [],
      // value
      v: store.iv
    }
    context.s.set(store, state)
  }
  return state
}
