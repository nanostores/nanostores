import { mapTemplate } from '../map-template/index.js'
import { computed } from '../computed/index.js'
import { atom } from '../atom/index.js'
import { map } from '../map/index.js'
import { mount } from '../index.js'
import { getValue as getValueDeprecated } from '../get-value/index.js'

function warning(text) {
  if (typeof console !== 'undefined' && console.warn) {
    console.groupCollapsed('Nano Stores: ' + text)
    console.trace('Source of deprecated call')
    console.groupEnd()
  }
}

export function createStore(...args) {
  warning('Replace createStore() to atom()')
  return mount(atom(), ...args)
}

export function createDerived(...args) {
  warning('Replace createDerived() to computed()')
  return computed(...args)
}

export function defineMap(...args) {
  warning('Replace defineMap() to mapTemplate()')
  return mapTemplate(...args)
}

export function createMap(...args) {
  warning('Replace createMap() to map()')
  return mount(map(), ...args)
}

export function getValue(...args) {
  warning('Replace getValue(store) to store.get()')
  return getValueDeprecated(...args)
}
