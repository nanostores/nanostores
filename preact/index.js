import { useState, useEffect } from 'preact/hooks'

import { getValue } from '../get-value/index.js'

export function useStore(store, options = {}) {
  let { keys = [] } = options
  let [, forceRender] = useState({})

  if (process.env.NODE_ENV !== 'production') {
    if (typeof store === 'function') {
      throw new Error(
        'Use useStore(Builder(id)) or useSync() ' +
          'from @logux/client/preact for builders'
      )
    }
  }

  useEffect(() => {
    let keysSet = new Set([...keys, undefined])
    let batching
    let unbind = store.listen((value, changed) => {
      if (!batching && (!keys || keysSet.has(changed))) {
        batching = 1
        setTimeout(() => {
          batching = undefined
          forceRender({})
        })
      }
    })

    return unbind
  }, [store, keys.toString()])

  return getValue(store)
}
