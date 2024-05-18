import { getPath } from '../index.js'

export function listenKeys($store, keys, listener) {
  return $store.listen((value, oldValue) => {
    if (keys.some(key => !$store.isEqual(value[key], oldValue[key]))) {
      listener(value, oldValue)
    }
  })
}

export function subscribeKeys($store, keys, listener) {
  let unbind = listenKeys($store, keys, listener)
  listener($store.value)
  return unbind
}

export function listenKeyPaths($store, keys, listener) {
  return $store.listen((value, oldValue) => {
    if (keys.some(key => !$store.isEqual(getPath(value, key), getPath(oldValue, key)))) {
      listener(value, oldValue)
    }
  })
}

export function subscribeKeyPaths($store, keys, listener) {
  let unbind = listenKeyPaths($store, keys, listener)
  listener($store.value)
  return unbind
}
