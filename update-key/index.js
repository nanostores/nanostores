export function updateKey(store, key, updater) {
  store.setKey(key, updater(store.get()[key]))
}
