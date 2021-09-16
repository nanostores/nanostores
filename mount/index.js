import { onCreate, onStop } from '../lifecycle/index.js'

export const mount = (store, cb) => {
  let unmount
  let unsubs = [
    onCreate(store, () => (unmount = cb())),
    onStop(store, () => {
      if (unmount) unmount()
      unmount = null
    })
  ]
  return () => {
    for (let unsub of unsubs) {
      unsub()
    }
  }
}
