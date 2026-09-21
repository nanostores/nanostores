import {
  computed,
  atom,
  type AnyStore,
  batched,
  type StoreValues,
  task
} from '../index.js'

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

let $count = atom(1)
let origins = [$word, $count] as const

let $label = computed(origins, (word, count) => word.repeat(count))
let label: string = $label.get()

let $batchedLabel = batched(origins, (word, count) => word.repeat(count))
let batchedLabel: string = $batchedLabel.get()

let $asyncLabel = computed(origins, (word, count) =>
  task(async () => word.repeat(count))
)
// THROWS Object is possibly 'undefined'
console.log($asyncLabel.get().length)

let values: StoreValues<typeof origins> = ['the', 2]
values[0] = 'a'

console.log(label, batchedLabel, values)

declare let $getOnly: AnyStore<number>
let anyStoreValues: StoreValues<[typeof $getOnly]> = [1]
// THROWS Type 'string' is not assignable to type 'number'
let wrongAnyStoreValues: StoreValues<[typeof $getOnly]> = ['x']
// THROWS No overload matches this call
computed([$getOnly], value => value)
// THROWS No overload matches this call
batched([$getOnly], value => value)

// A source that only listens is not enough here: `computed` and `batched`
// skip recomputing until the global epoch moves, and nothing but a real
// Nano Store moves it.
declare let $adapter: {
  get(): number
  listen(listener: () => void): () => void
}
// THROWS No overload matches this call
computed([$adapter], value => value)
// THROWS No overload matches this call
computed($adapter, value => value)

let $wordLength = computed(get => get($word).length + get($count))
let wordLength: number = $wordLength.get()
// THROWS Type 'number' is not assignable to type 'string'
let wrongWordLength: string = $wordLength.get()

let $batchedWord = batched(get => get($word))
let batchedWord: 'a' | 'the' = $batchedWord.get()

// Callback with get() does not unwrap deprecated tasks
let $promise = computed(get => task(async () => get($word).length))
let promise: Promise<number> = $promise.get()

// THROWS Argument of type 'AnyStore<number>' is not assignable
computed(get => get($getOnly))
// A store, which can be only read and listened to, does not move the epoch
// THROWS is not assignable to parameter of type 'Store'
batched(get => get($adapter))

console.log(anyStoreValues, wrongAnyStoreValues)
console.log(wordLength, wrongWordLength, batchedWord, promise)
