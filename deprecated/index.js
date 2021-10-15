import { task, startTask, allTasks, cleanTasks } from '../task/index.js'
import { mapTemplate } from '../map-template/index.js'
import { computed } from '../computed/index.js'
import { onMount } from '../lifecycle/index.js'
import { atom } from '../atom/index.js'
import { map } from '../map/index.js'

function warning(text) {
  if (typeof console !== 'undefined' && console.warn) {
    console.groupCollapsed('Nano Stores: ' + text)
    console.trace('Source of deprecated call')
    console.groupEnd()
  }
}

export function createStore(...args) {
  warning('Replace createStore() to atom()')
  return onMount(atom(), ...args)
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
  return onMount(map(), ...args)
}

export function getValue(store) {
  warning('Replace getValue(store) to store.get()')
  return store.get()
}

export function keepActive(store) {
  warning('Replace keepActive() to keepMount()')
  store.listen(() => {})
}

export function clearEffects() {
  warning('Replace clearEffects() to cleanTasks()')
  cleanTasks()
}

export function allEffects() {
  warning('Replace allEffects() to allTasks()')
  return allTasks()
}

export function startEffect() {
  warning('Replace startEffect() to startTask()')
  return startTask()
}

export function effect(...args) {
  warning('Replace effect() to task()')
  return task(...args)
}

export function update(store, updater) {
  warning('update() was deprecated')
  store.set(updater(store.get()))
}

export function updateKey(store, key, updater) {
  warning('updateKey() was deprecated')
  store.setKey(key, updater(store.get()[key]))
}
