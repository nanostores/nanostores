import { useState, useEffect } from 'preact/hooks'

import { listenKeys } from '../listen-keys/index.js'

export function useStore(store, opts = {}) {
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
    let batching
    let rerender = () => {
      if (!batching) {
        batching = 1
        setTimeout(() => {
          batching = undefined
          forceRender({})
        })
      }
    }
    if (opts.keys) {
      return listenKeys(store, opts.keys, rerender)
    } else {
      return store.listen(rerender)
    }
  }, [store, '' + opts.keys])

  return store.get()
}
