import { computed, atom, task } from '../index.js'

let $word = atom<'a' | 'the'>('a')
let $length = computed($word, word => word.length)
// THROWS Type 'number | undefined' is not assignable to type 'number'.
let length: number = $length.value

let $async = computed($word, word =>
  task(async () => {
    return word.length
  })
)

// THROWS Object is possibly 'undefined'
console.log($async.get() + 1)
