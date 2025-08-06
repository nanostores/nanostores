import { NONE } from '@spred/core'

import { atom } from '../atom/index.js'

/* @__NO_SIDE_EFFECTS__ */
export const map = (initial = {}) => {
  let $map = atom(initial)

  $map.setKey = function (key, value) {
    $map.update(m => {
      if (typeof value === 'undefined' && key in m) {
        m = { ...m }
        delete m[key]
        return m
      } else if (m[key] !== value) {
        return { ...m, [key]: value }
      }

      return NONE
    })
  }

  return $map
}
