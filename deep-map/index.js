import { atom } from '../atom/index.js'
import { getStoreState } from '../context/index.js'
import { getPath, setPath } from './path.js'

export { getPath, setPath } from './path.js'

export function deepMap(initial = {}) {
  let store = atom(initial)
  store.setKey = (key, value) => {
    let state = getStoreState(store)
    if (getPath(state.v, key) !== value) {
      state.v = setPath(state.v, key, value)
      store.notify(key)
    }
  }
  return store
}
