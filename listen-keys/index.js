import { getPath } from '../deep-map/path.js'

export function listenKeys($store, keys, listener) {
  let keysSet = new Set(keys)
  return $store.listen((value, oldValue, changed) => {
    if (
      changed === undefined
        ? keys.some(
            key =>
              oldValue === undefined ||
              // `map` keys are plain properties, but a `deepMap` key is a path into
              // the value, where a plain lookup would compare undefined to undefined
              // and never report a change.
              value[key] !== oldValue[key] ||
              getPath(value, key) !== getPath(oldValue, key)
          )
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
