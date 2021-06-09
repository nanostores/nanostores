import { unstable_batchedUpdates } from 'react-dom'
import React from 'react'

import { getValue } from '../get-value/index.js'

export function useStore(store) {
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
    let unbind = store.listen(() => {
      unstable_batchedUpdates(() => {
        forceRender({})
      })
    })

    return unbind
  }, [store])

  return getValue(store)
}
