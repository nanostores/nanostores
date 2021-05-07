import React from 'react'

import { getValue } from '../get-value/index.js'

export function useStore(store) {
  let [, forceRender] = React.useState({})

  if (process.env.NODE_ENV !== 'production') {
    if (typeof store === 'function') {
      throw new Error(
        'Use useStore(Builder(id)) or useSync() ' +
          'from @logux/state/sync/react for builders'
      )
    }
  }

  React.useEffect(() => {
    let batching
    let unbind = store.listen(() => {
      if (batching) return
      batching = 1
      setTimeout(() => {
        batching = undefined
        forceRender({})
      })
    })

    return unbind
  }, [store])

  return getValue(store)
}
