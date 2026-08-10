import { map, WritableAtom } from '../index.js'
import { listenKeys, subscribeKeys } from './index.js'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: string; b: number; c?: number }

type TestKey = 'a' | 'b' | 'c' | 'id' | 'isLoading'

let test = map<TestType>()

listenKeys(test, ['a', 'b', 'c'], (_, __, changed) => {
  // THROWS is possibly 'undefined'
  changed.toUpperCase()
  if (changed !== undefined) {
    let key: TestKey = changed
    console.log(key)
  }
})

subscribeKeys(test, ['a'], (_, oldValue, changed) => {
  // THROWS is possibly 'undefined'
  oldValue.isLoading
  // THROWS is possibly 'undefined'
  changed.toUpperCase()
  if (changed !== undefined) {
    let key: TestKey = changed
    console.log(key)
  }
})

// THROWS is not assignable
listenKeys(test, ['unknownKey'], () => {})

declare let $fakeStore: {
  setKey: (key: 'hey' | 'you', value?: boolean | string) => void
} & WritableAtom<null>

listenKeys($fakeStore, ['hey', 'you'], (_, __, changed) => {
  // THROWS is possibly 'undefined'
  changed.toUpperCase()
  if (changed !== undefined) {
    let key: 'hey' | 'you' = changed
    console.log(key)
  }
})

// THROWS is not assignable
listenKeys($fakeStore, ['unknownKey'], () => {})
