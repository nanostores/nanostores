import { createComputed } from '../create-computed/index.js'

function warning(text) {
  if (typeof console !== 'undefined' && console.warn) {
    console.groupCollapsed('Nano Stores: ' + text)
    console.trace('Source of deprecated call')
    console.groupEnd()
  }
}

export function createDerived(...args) {
  warning('Replace createDerived() to createComputed()')
  return createComputed(...args)
}
