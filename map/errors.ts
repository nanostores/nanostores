import { map, type MapStoreKeys } from '../index.js'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: string; b: number; c?: number }

let $test = map<TestType>({ id: '', isLoading: true })

$test.subscribe((_, __, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS have no overlap
  if (changedKey === 'z') {
  }
})

$test.listen((_, oldValue, changedKey) => {
  // THROWS is possibly 'undefined'
  oldValue.isLoading
  if (oldValue !== undefined) {
    let loading: boolean = oldValue.isLoading
    console.log(loading)
  }
  if (changedKey === 'a') {
  }
  // THROWS have no overlap
  if (changedKey === 'z') {
  }
  // THROWS is possibly 'undefined'
  changedKey.toString()
})

$test.setKey('isLoading', true)
// THROWS 'undefined' is not assignable to parameter of type 'boolean'
$test.setKey('isLoading', undefined)
$test.setKey('id', '123')
$test.setKey('c', 5)
$test.setKey('c', undefined)
// THROWS Argument of type '"z"' is not assignable to parameter
$test.setKey('z', '123')

$test.setKey('isLoading', false)
$test.setKey('a', 'string')
$test.setKey('b', 5)
// THROWS Argument of type '"z"' is not assignable to parameter
$test.setKey('z', '123')

// A key carried by only one union member still has its value checked.
// THROWS Argument of type 'number' is not assignable to parameter of type 'string'
$test.setKey('a', 5)
// THROWS Argument of type 'undefined' is not assignable to parameter of type 'string'
$test.setKey('a', undefined)
// THROWS Argument of type 'number' is not assignable to parameter of type 'string'
$test.setKey('id', 5)

let $testIndexSignature = map<Record<string, number>>({})
$testIndexSignature.setKey('a', 1)
$testIndexSignature.setKey('a', undefined)

let $preinitialized = map()
let initialValue: object = $preinitialized.value

$test.eqKey = (oldValue, newValue, key) => key === 'id' || oldValue === newValue
// THROWS is not assignable
$test.eqKey = () => 'not a boolean'

let $counted = map({ a: 1 })
$counted.eqKey = (oldValue, newValue, key) => {
  // THROWS is possibly 'undefined'
  oldValue.toFixed(2)
  // THROWS is possibly 'undefined'
  newValue.toFixed(2)
  return key === 'a' && oldValue === newValue
}

let $lazyCounted = map<{ a: number }>()
// A map with no initial value still compares real values, not only `undefined`.
let lazyEqual: boolean = $lazyCounted.eqKey(1, 2, 'a')
let lazyMissing: boolean = $lazyCounted.eqKey(undefined, 2, 'a')
// THROWS Argument of type 'string' is not assignable to parameter
$lazyCounted.eqKey('nope', 2, 'a')

// An index signature supplies the value type the same way a declared key does.
let indexEqual: boolean = $testIndexSignature.eqKey(1, 2, 'a')
// THROWS Argument of type 'string' is not assignable to parameter
$testIndexSignature.eqKey('nope', 2, 'a')

// An empty map still accepts every key of the union, and every branch of
// the union is still a legal whole value.
let $partialUnion = map<TestType>()
$partialUnion.setKey('id', '123')
$partialUnion.setKey('a', 'string')
$partialUnion.setKey('b', 5)
$partialUnion.setKey('isLoading', false)
// THROWS Argument of type '"z"' is not assignable to parameter
$partialUnion.setKey('z', 'string')
let unionEqual: boolean = $partialUnion.eqKey('old', 'new', 'a')
// THROWS Argument of type 'number' is not assignable to parameter
$partialUnion.eqKey(5, 'new', 'a')

let $partial = map<{ a: string; b: number }>()
// Nothing has been set yet, so an empty object is a complete value and
// every key can be cleared again.
$partial.set({})
$partial.set({ a: 'value' })
$partial.setKey('a', undefined)

let partialValue: Partial<{ a: string; b: number }> = $partial.get()
// THROWS Type 'string | undefined' is not assignable to type 'string'
let missingValue: string = $partial.get().a

// Passing `undefined` is the same call as passing nothing, and reads the
// same way.
let $explicitUndefined = map<{ a: string }>(undefined)
// THROWS Type 'string | undefined' is not assignable to type 'string'
let explicitValue: string = $explicitUndefined.get().a

declare let maybeInitial: undefined | { a: string }
let $maybeInitial = map(maybeInitial)
// THROWS Type 'string | undefined' is not assignable to type 'string'
let maybeValue: string = $maybeInitial.get().a

// A map that definitely got a value keeps every key required.
let $initialized = map({ a: 'value' })
let initializedValue: string = $initialized.get().a
// THROWS Argument of type 'undefined' is not assignable to parameter
$initialized.set(undefined)

let $extended = map<
  { a: number; b: string },
  { setKey: (key: 'ext', value: number) => void }
>({ a: 0, b: '' })
let extendedKey: MapStoreKeys<typeof $extended> = 'a'
// THROWS Type '"ext"' is not assignable to type '"a" | "b"'
extendedKey = 'ext'

console.log(
  lazyEqual,
  lazyMissing,
  indexEqual,
  unionEqual,
  partialValue,
  missingValue,
  explicitValue,
  maybeValue,
  initializedValue,
  extendedKey
)
