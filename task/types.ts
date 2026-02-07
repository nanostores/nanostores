import { atom, computedAsync, task, type AsyncValue } from '../index.js'

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
let $result = computedAsync($origin, origin => {
  return task(() => {
    return Promise.resolve(origin + 1)
  })
})

let result: AsyncValue<number> = $result.get()

console.log(result)
