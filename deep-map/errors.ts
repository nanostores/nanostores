import { deepMap, getKey, atom, map } from '../index.js'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: { b: number; c: string[] } }

let test = deepMap<TestType>()

test.setKey('isLoading', true)
test.setKey('id', '123')
test.setKey('a', { b: 1, c: [] })
test.setKey('a.b', 123)
test.setKey('a.c', [''])
test.setKey('a.c[3]', '123')
// THROWS Argument of type 'number' is not assignable to parameter
test.setKey('a.c[3]', 123)
// THROWS Argument of type '"z"' is not assignable to parameter
test.setKey('z', '123')

test.setKey('isLoading', false)
// THROWS Argument of type '"z"' is not assignable to parameter
test.setKey('z', '123')

type TestTypeIndexSignature = {
  id: string
  isRecord: Record<string, number>
  isArray: Array<TestType>
}

let $testIndexSignature = deepMap<Record<string, Record<string, number>>>()
let $testIndexSignature2 = deepMap<Record<string, TestType>>()
let $testIndexSignature3 = deepMap<Record<string, TestTypeIndexSignature>>()

$testIndexSignature.setKey('a', undefined)
$testIndexSignature2.setKey('a', undefined)
// THROWS Argument of type 'undefined' is not assignable to parameter
test.setKey('a', undefined)
$testIndexSignature.setKey('a.b', undefined)
$testIndexSignature.setKey('a.b', 1)
// THROWS Argument of type 'string' is not assignable to parameter
$testIndexSignature.setKey('a.b', 'hej')
// THROWS Argument of type 'undefined' is not assignable to parameter
$testIndexSignature2.setKey('a.isLoading', undefined)
// THROWS Argument of type 'string' is not assignable to parameter
$testIndexSignature2.setKey('a.isLoading', 'incorrect')

$testIndexSignature3.setKey('a.isRecord', {})
$testIndexSignature3.setKey('a.isRecord.b', 1)
// THROWS Argument of type 'string' is not assignable to parameter
$testIndexSignature3.setKey('a.isRecord.b', 'hej')

$testIndexSignature3.setKey('a.isArray', [])
$testIndexSignature3.setKey('a.isArray[0]', {
  id: '123',
  isLoading: true
})
// THROWS Argument of type '{ id: string; }' is not assignable to parameter
$testIndexSignature3.setKey('a.isArray[0]', {
  id: '123'
})
$testIndexSignature3.setKey('a.isArray[0].id', '123')
// THROWS Argument of type 'number' is not assignable to parameter
$testIndexSignature3.setKey('a.isArray[0].id', 123)

let $store = map({
  user: {
    name: 'John'
  }
})

let $store2 = atom('john')

let $store3 = atom({
  user: {
    name: 'John'
  }
})
// THROWS Argument of type '"user.nejm"' is not assignable to parameter of type '"user" | "user.name"'.
let throws = getKey($store, 'user.nejm')

// THROWS Argument of type '"user[0]"' is not assignable to parameter of type '"user" | "user.name"'.
let throws1 = getKey($store, 'user[0]')

// THROWS Argument of type '"usser"' is not assignable to parameter of type '"user" | "user.name"'.
let throws2 = getKey($store, 'usser')

// THROWS Argument of type 'PreinitializedWritableAtom<string> & object' is not assignable to parameter of type 'AnyStore<Record<string, unknown>>'.
let throws3 = getKey($store2, 'john')

let works = getKey($store3, 'user.name')
