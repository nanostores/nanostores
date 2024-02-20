export function listenKeys($store, keys, listener) {
  let keysSet = new Set([...keys, undefined])
  return $store.listen((value, oldValue, changed) => {
    if (keysSet.has(changed)) {
      listener(value, oldValue, changed)
    }
  })
}
