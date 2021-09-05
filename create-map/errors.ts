import { createMap } from '../index.js'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: string; b: number }

let test = createMap<TestType>()

test.subscribe((_, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS always return 'false'
  if (changedKey === 'z') {
  }
})

test.listen((_, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS always return 'false'
  if (changedKey === 'z') {
  }
})

test.setKey('isLoading', true)
test.setKey('id', '123')
// THROWS Argument of type '"z"' is not assignable to parameter
test.setKey('z', '123')

test.setKey('isLoading', false)
test.setKey('a', 'string')
test.setKey('b', 5)
// THROWS Argument of type '"z"' is not assignable to parameter
test.setKey('z', '123')

test.notify('isLoading')
test.notify('id')
test.notify('a')
test.notify('b')
// THROWS Argument of type '"z"' is not assignable to parameter
test.notify('z')
