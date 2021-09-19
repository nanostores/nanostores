import { clean } from '../index.js'
import { onCreate, onStop } from '../lifecycle/index.js'

export const STORE_CLEAN_DELAY = 1000

export const mount = (store, cb) => {
  let destroy
  let unsubs = [
    onCreate(store, () => {
      if (store.active) return
      destroy = cb()
      store.active = true
    }),
    onStop(store, () => {
      setTimeout(() => {
        if (store.active && !store.lc) {
          destroy && destroy()
          destroy = undefined
          store.active = undefined
        }
      }, STORE_CLEAN_DELAY)
    })
  ]

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      if (destroy) destroy()
      store.active = false
      destroy = null
    }
  }
  return () => {
    for (let unsub of unsubs) {
      unsub()
    }
  }
}
