import { deepMap } from '../index.js'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: { b: number; c: string[] } }

let $test = deepMap<TestType>()

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
$test.setKey('id', '123')
$test.setKey('a', { b: 1, c: [] })
$test.setKey('a.b', 123)
$test.setKey('a.c', [''])
$test.setKey('a.c[3]', '123')
// THROWS Argument of type 'number' is not assignable to parameter
$test.setKey('a.c[3]', 123)
// THROWS Argument of type '"z"' is not assignable to parameter
$test.setKey('z', '123')

$test.setKey('isLoading', false)
// THROWS Argument of type '"z"' is not assignable to parameter
$test.setKey('z', '123')

let $test2 = deepMap<TestType | undefined>({ id: '123', isLoading: true })
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

$test2.setKey('a.c[3]', '123')
// THROWS Argument of type 'number' is not assignable to parameter
$test2.setKey('a.c[3]', 123)

// THROWS Argument of type undefined is not assignable to parameter of type 'Record<string, unknown>'.
let $test3 = deepMap<Record<string, unknown>>(undefined) // Currently doesn't throw
// THROWS Expected 1 arguments, but got 0
let $test4 = deepMap<Record<string, unknown>>() // Currently doesn't throw

let $test5 = deepMap<Record<string, unknown> | undefined>()
let $test6 = deepMap<Record<string, unknown> | undefined>(undefined)
