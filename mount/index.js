import { onStart, onStop } from '../lifecycle/index.js'
import { clean } from '../index.js'

export let STORE_UNMOUNT_DELAY = 1000

export let mount = (store, initialize) => {
  let destroy
  let unbindStart = onStart(store, () => {
    if (store.active) return
    destroy = initialize()
    store.active = true
  })
  let unbindStop = onStop(store, () => {
    setTimeout(() => {
      if (store.active && !store.lc) {
        destroy && destroy()
        destroy = undefined
        store.active = false
      }
    }, STORE_UNMOUNT_DELAY)
  })

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      if (destroy) destroy()
      store.active = false
      destroy = null
    }
  }
  return () => {
    unbindStart()
    unbindStop()
  }
}
