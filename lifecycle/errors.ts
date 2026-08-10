import { atom, map, onMount, onNotify, onSet } from '../index.js'

let $store = atom(0)
let $map = map({ count: 0 })

onMount($store, () => {})

onMount($store, () => {
  return () => {}
})

onMount<{ mounts: number }>($store, ({ shared }) => {
  let mounts: number = shared.mounts
  console.log(mounts)
})

// THROWS Expected 2 arguments, but got 1
onMount($store)

onSet($store, ({ abort, changed, newValue }) => {
  abort()
  let key: undefined = changed
  let value: number = newValue
  console.log(key, value)
})

onNotify($store, ({ abort, changed, oldValue }) => {
  abort()
  let key: undefined = changed
  // THROWS is not assignable to type 'number'
  let value: number = oldValue
  console.log(key, value)
})

onSet($map, ({ abort, changed, newValue }) => {
  abort()
  let value: number = newValue.count
  // THROWS is possibly 'undefined'
  changed.toString()
  console.log(value)
})

onNotify($map, ({ abort, changed, oldValue }) => {
  abort()
  // THROWS is possibly 'undefined'
  changed.toString()
  // THROWS is possibly 'undefined'
  oldValue.count
})
