import { getValue } from '../get-value/index.js'

export function update (store, updater) {
  store.set(updater(getValue(store)))
}

export function updateKey (store, key, updater) {
  store.setKey(key, updater(getValue(store)[key]))
}
