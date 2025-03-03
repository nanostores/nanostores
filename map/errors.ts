import { map } from '../index.js'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: string; b: number; c?: number }

let $test = map<TestType>()

$test.subscribe((_, __, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS have no overlap
  if (changedKey === 'z') {
  }
})

$test.listen((_, __, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS have no overlap
  if (changedKey === 'z') {
  }
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

let $testIndexSignature = map<Record<string, number>>()
$testIndexSignature.setKey('a', 1)
$testIndexSignature.setKey('a', undefined)

let $preinitialized = map()
let initialValue: object | undefined = $preinitialized.value

let $test2 = map<TestType | undefined>({ id: '123', isLoading: true })
$test2.set(undefined)
// THROWS Argument of type 'undefined' is not assignable to parameter of type 'TestType'
$test.set(undefined)

// THROWS Argument of type 'string' is not assignable to parameter of type 'boolean'
$test2.setKey('isLoading', 'banana')

// Subscribe picks up the undefined type of the store
$test2.subscribe(value => {
  // THROWS 'value' is possibly 'undefined'
  value.isLoading
})

// THROWS Argument of type undefined is not assignable to parameter of type 'Record<string, unknown>'.
let $test3 = map<Record<string, unknown>>(undefined) // Currently doesn't throw
// THROWS Expected 1 arguments, but got 0
let $test4 = map<Record<string, unknown>>() // Currently doesn't throw

let $test5 = map<Record<string, unknown> | undefined>()
let $test6 = map<Record<string, unknown> | undefined>(undefined)
