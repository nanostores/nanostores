import { createMap } from '../index.js'

type TestType = 
  | { id: string; isLoading: true }
  | { isLoading: false; a: string; b: number }

let test = createMap<TestType>()

test.subscribe((_, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS This condition will always return 'false' since the types '"id" | "b" | "a" | "isLoading" | undefined' and '"c"' have no overlap.
  if (changedKey === 'c') {
  }
})

test.listen((_, changedKey) => {
  if (changedKey === 'a') {
  }
  // THROWS This condition will always return 'false' since the types '"id" | "b" | "a" | "isLoading"' and '"c"' have no overlap.
  if (changedKey === 'c') {
  }
})

test.setKey('isLoading', true);
test.setKey('id', '123');
// THROWS Argument of type '"c"' is not assignable to parameter of type '"id" | "b" | "a" | "isLoading"'.
test.setKey('c', '123');

test.setKey('isLoading', false);
test.setKey('a', 'string')
test.setKey('b', 5)
// THROWS Argument of type '"c"' is not assignable to parameter of type '"id" | "b" | "a" | "isLoading"'.
test.setKey('c', '123')

test.notify('isLoading')
test.notify('id')
test.notify('a')
test.notify('b')
// THROWS Argument of type '"c"' is not assignable to parameter of type '"id" | "b" | "a" | "isLoading"'.
test.notify('c')
