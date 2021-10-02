import React from 'react'

import { batch } from './batch/index.js'
import { listenKeys } from '../listen-keys/index.js'

export { batch }

export function useStore(store, opts = {}) {
  let [, forceRender] = React.useState({})

  if (process.env.NODE_ENV !== 'production') {
    if (typeof store === 'function') {
      throw new Error(
        'Use useStore(Builder(id)) or useSync() ' +
          'from @logux/client/react for builders'
      )
    }
  }

  React.useEffect(() => {
    let rerender = () => {
      batch(() => {
        forceRender({})
      })
    }
    if (opts.keys) {
      return listenKeys(store, opts.keys, rerender)
    } else {
      return store.listen(rerender)
    }
  }, [store, '' + opts.keys])

  return store.get()
}
