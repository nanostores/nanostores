import { useState, useEffect } from 'preact/hooks'

import { getValue } from '../get-value/index.js'

export function useStore(store) {
  let [, forceRender] = useState({})

  if (process.env.NODE_ENV !== 'production') {
    if (typeof store === 'function') {
      throw new Error('not implemented')
    }
  }

  useEffect(() => {
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
