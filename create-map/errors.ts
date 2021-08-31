import { createMap } from '../index.js'

type TestType = 
  | { id: string; isLoading: true }
  | { isLoading: false; a: string; b: number }

let test = createMap<TestType>()

test.subscribe((_, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS always return 'false' since the types "id" | "isLoading" | "a" | "b"
  if (changedKey === 'c') {
  }
})

test.listen((_, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS always return 'false' since the types "id" | "isLoading" | "a" | "b"
  if (changedKey === 'c') {
  }
})

test.setKey('isLoading', true);
test.setKey('id', '123');
// THROWS always return 'false' since the types "id" | "isLoading" | "a" | "b"
test.setKey('c', '123');

test.setKey('isLoading', false);
test.setKey('a', 'string')
test.setKey('b', 5)
// THROWS always return 'false' since the types "id" | "isLoading" | "a" | "b"
test.setKey('c', '123')

test.notify('isLoading')
test.notify('id')
test.notify('a')
test.notify('b')
// THROWS always return 'false' since the types "id" | "isLoading" | "a" | "b"
test.notify('c')
