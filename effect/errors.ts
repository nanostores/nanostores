import { atom } from '../atom/index.js'
import type { Getter } from '../computed/index.js'
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

let stop: () => void = effect(get => {
  let first: string = get($first)
  let num: number = get($adapter) + get($age)
  // THROWS Type 'number' is not assignable to type 'string'
  let wrong: string = get($age)
  return () => {}
})

effect(get => {
  // THROWS Argument of type 'AnyStore<number>' is not assignable
  get($getOnly)
})

// THROWS Type 'number' is not assignable to type 'void | (() => void)'
effect(get => get($age))

let fullName = (get: Getter): string => `${get($first)} ${get($last)}`
effect(get => {
  console.log(fullName(get))
})
