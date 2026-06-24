export function listenKeys($store, keys, listener) {
  let keysSet = new Set(keys)
  return $store.listen((value, oldValue, changed) => {
    if (
      changed === undefined
        ? keys.some(key => value[key] !== oldValue[key])
        : (keysSet.has(changed) || keysSet.has(changed.split(/\.|\[/)[0]))
    ) {
      listener(value, oldValue, changed)
    }
  })
}

export function subscribeKeys($store, keys, listener) {
  let unbind = listenKeys($store, keys, listener)
  listener($store.value)
  return unbind
}
