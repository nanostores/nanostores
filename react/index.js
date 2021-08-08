import React from 'react'

import { getValue } from '../get-value/index.js'
import { batch } from './batch/index.js'

export { batch }

export function useStore(store, options = {}) {
  let { keys = [] } = options
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
    let keysSet = new Set([...keys, undefined])
    let unbind = store.listen((value, changed) => {
      if (!keys || keysSet.has(changed)) {
        batch(() => {
          forceRender({})
        })
      }
    })
    return unbind
  }, [store, ...keys])

  return getValue(store)
}
