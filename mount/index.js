import { onStart, onStop } from '../lifecycle/index.js'
import { clean } from '../index.js'

export let STORE_UNMOUNT_DELAY = 1000

export let mount = (store, initialize) => {
  let destroy
  let unbindStart = onStart(store, () => {
    if (!store.active) {
      destroy = initialize()
      store.active = true
    }
  })
  let unbindStop = onStop(store, () => {
    setTimeout(() => {
      if (store.active && !store.lc) {
        if (destroy) destroy()
        destroy = undefined
        store.active = false
      }
    }, STORE_UNMOUNT_DELAY)
  })

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      if (destroy) destroy()
      destroy = undefined
      store.active = false
    }
  }
  return () => {
    unbindStart()
    unbindStop()
  }
}
