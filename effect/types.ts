import { effect } from '../index.js'

let a = await effect(() => {
  return 1
})

let b = await effect(async () => {
  await Promise.resolve()
  return 'a'
})

let str: string = b
let num: number = a

console.log(str, num)
