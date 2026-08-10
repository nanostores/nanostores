import { atom } from '../atom/index.js'
import type { AnyStore } from '../map/index.js'
import { effect } from './index.js'

let $first = atom('Tony')
let $last = atom('Stark')
let $age = atom(38)

effect([$first, $last, $age], (first, last, age) => {
  let firstStr: string = first
  let lastStr: string = last
  let ageNum: number = age
})

let origins = [$first, $age] as const
effect(origins, (first, age) => {
  let firstStr: string = first
  let ageNum: number = age
})

declare let $getOnly: AnyStore<number>
// THROWS No overload matches this call
effect([$getOnly], () => {})

// `effect` reruns straight from the listener, so an adapter that can only
// be read and listened to is a complete source here.
declare let $adapter: {
  get(): number
  listen(listener: () => void): () => void
}
effect($adapter, value => {
  let num: number = value
})
effect([$adapter, $age], (value, age) => {
  let num: number = value + age
})
