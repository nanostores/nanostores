import { atom } from '../atom/index.js'
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
