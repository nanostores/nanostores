import { deepMap } from '../index.js'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: { b: number; c: string[] } }

let test = deepMap<TestType>()

test.subscribe((_, __, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS have no overlap
  if (changedKey === 'z') {
  }
})

test.listen((_, __, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS have no overlap
  if (changedKey === 'z') {
  }
})

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
