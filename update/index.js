export function update(store, updater) {
  store.set(updater(store.get()))
}

export function updateKey(store, key, updater) {
  store.setKey(key, updater(store.get()[key]))
}
