import { atom } from '../atom/index.js'
import { computed } from './index.js'

let $word = atom<'a' | 'the'>('a')
let $length = computed($word, word => word.length)
// THROWS Type 'number | undefined' is not assignable to type 'number'.
let length: number = $length.value
