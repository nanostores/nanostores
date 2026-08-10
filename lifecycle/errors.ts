import { atom, map, onMount, onNotify, onSet } from '../index.js'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: string; b: number; c?: number }

let $store = atom(0)
let $map = map({ count: 0 })
let $unionMap = map<TestType>({ id: '', isLoading: true })

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

// `setKey` accepts a key from any branch of a union value, and the runtime
// forwards it, so the payload has to accept every branch's keys too — not
// only the ones all branches share.
onSet($unionMap, ({ changed }) => {
  let branchKey: typeof changed = 'a'
  let sharedKey: typeof changed = 'isLoading'
  console.log(branchKey, sharedKey)
})

onNotify($unionMap, ({ changed }) => {
  let branchKey: typeof changed = 'b'
  let optionalKey: typeof changed = 'c'
  // Not a guard on the union fix — `'z'` is rejected either way. This one
  // is here so the key type cannot quietly widen to `string`.
  // THROWS is not assignable to type
  let unknownKey: typeof changed = 'z'
  console.log(branchKey, optionalKey, unknownKey)
})
