export function listenKeys($store, keys, listener, signal) {
  let keysSet = new Set(keys).add(undefined)
  return $store.listen((value, oldValue, changed) => {
    if (keysSet.has(changed)) {
      listener(value, oldValue, changed)
    }
  }, signal)
}

export function subscribeKeys($store, keys, listener, signal) {
  if (signal?.aborted) return () => {}
  let unbind = listenKeys($store, keys, listener, signal)
  listener($store.value)
  return unbind
}
