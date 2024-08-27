import { atom, computed, task } from '../index.js'

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

let $origin = atom(1)
let $result = computed($origin, origin => {
  return task(async () => {
    return origin + 1
  })
})

let result: number | undefined = $result.get()

console.log(result)
