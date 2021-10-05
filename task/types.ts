import { task } from '../index.js'

let a = await task(() => {
  return 1
})

let b = await task(async () => {
  await Promise.resolve()
  return 'a'
})

let str: string = b
let num: number = a

console.log(str, num)
