import { Signal } from '@spred/core'

import { getPath } from '../deep-map/path.js'

export function listenKeys($store, keys, listener) {
  let keySignals = keys.map(key => new Signal(get => getPath(get($store), key)))

  let $computed = new Signal(get => {
    keySignals.forEach(get)
    return $store.value
  })

  return $computed.listen(listener)
}

export function subscribeKeys($store, keys, listener) {
  let unbind = listenKeys($store, keys, listener)
  listener($store.value)
  return unbind
}
