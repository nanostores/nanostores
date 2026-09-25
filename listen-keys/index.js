import { getPath } from '../deep-map/path.js'

export function listenKeys($store, keys, listener) {
  let keysSet = new Set(keys)
  return $store.listen((value, oldValue, changed) => {
    let pathChanged = key =>
      !Object.is(getPath(value, key), getPath(oldValue, key))
    if (
      changed === undefined
        ? keys.some(
            key =>
              oldValue === undefined ||
              ($store.eqKey
                ? !$store.eqKey(oldValue[key], value[key], key)
                : pathChanged(key))
          )
        : keysSet.has(changed) ||
          (typeof changed === 'string' &&
            (keysSet.has(changed.split(/\.|\[/)[0]) ||
              // In a deep map, setKey('a', ...) or removing an array item
              // can change a watched 'a.b' or 'list[1]' too
              (!$store.eqKey &&
                oldValue !== undefined &&
                keys.some(pathChanged))))
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
