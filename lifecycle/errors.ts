import { atom, onMount } from '../index.js'

let $store = atom(0)

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
