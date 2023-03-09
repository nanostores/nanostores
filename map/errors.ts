import { map } from '../index.js'
import type { AllSubscribableKeys } from './index'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: string; b: number; c?: number }

type Eq<T1, T2> = T1 extends T2 ? true : false
type Assert<V extends true> = V

let test = map<TestType>()

type K1 = Assert<
  Eq<AllSubscribableKeys<typeof test>, 'id' | 'isLoading' | 'a' | 'b' | 'c'>
>

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
test.setKey('c', 5)
test.setKey('c', undefined)
// THROWS Argument of type '"z"' is not assignable to parameter
test.setKey('z', '123')

test.setKey('isLoading', false)
test.setKey('a', 'string')
test.setKey('b', 5)
// THROWS Argument of type '"z"' is not assignable to parameter
test.setKey('z', '123')

type AcceptableKeys = 'hey' | 'you'
declare const fakeStore: {
  setKey: (key: AcceptableKeys, value?: boolean | string) => void
}
type K2 = Assert<Eq<AllSubscribableKeys<typeof fakeStore>, AcceptableKeys>>
