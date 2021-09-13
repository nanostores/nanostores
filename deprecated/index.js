import { createMapTemplate } from '../create-map-template/index.js'
import { createComputed } from '../create-computed/index.js'
import { atom } from '../atom/index.js'

function warning(text) {
  if (typeof console !== 'undefined' && console.warn) {
    console.groupCollapsed('Nano Stores: ' + text)
    console.trace('Source of deprecated call')
    console.groupEnd()
  }
}

export function createStore(...args) {
  warning('Replace createStore() to atom()')
  return atom(...args)
}

export function createDerived(...args) {
  warning('Replace createDerived() to createComputed()')
  return createComputed(...args)
}

export function defineMap(...args) {
  warning('Replace defineMap() to createMapTemplate()')
  return createMapTemplate(...args)
}
