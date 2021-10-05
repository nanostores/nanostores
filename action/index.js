import { onNotify } from '../index.js'

export const action =
  (store, title, cb) =>
  (...params) => {
    let unbind = onNotify(store, ({ shared }) => {
      shared.actionName = title
    })
    let res = cb(...params)
    unbind()
    return res
  }
