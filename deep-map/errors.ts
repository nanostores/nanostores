import { deepMap } from '../index.js'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: { b: number; c: string[] } }

let test = deepMap<TestType>()

test.subscribe((_, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS have no overlap
  if (changedKey === 'z') {
  }
})

test.listen((_, changedKey) => {
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
// THROWS Argument of type '"z"' is not assignable to parameter
test.setKey('z', '123')

test.setKey('isLoading', false)
// THROWS Argument of type '"z"' is not assignable to parameter
test.setKey('z', '123')
