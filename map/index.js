import { atom } from '../atom/index.js'
import { getStoreState } from '../context/index.js'

export let map = (value = {}) => {
  let store = atom(value)

  store.setKey = function (key, newValue) {
    let state = getStoreState(store)
    if (typeof newValue === 'undefined') {
      if (key in state.v) {
        state.v = { ...state.v }
        delete state.v[key]
        store.notify(key)
      }
    } else if (state.v[key] !== newValue) {
      state.v = {
        ...state.v,
        [key]: newValue
      }
      store.notify(key)
    }
  }

  return store
}
