import { listenKeys } from './index.js'
import { map, WritableAtom } from '../index.js'

type TestType =
  | { id: string; isLoading: true }
  | { isLoading: false; a: string; b: number; c?: number }

let test = map<TestType>()

listenKeys(test, ['a', 'b', 'c'], () => {})

// THROWS is not assignable
listenKeys(test, ['unknownKey'], () => {})

declare let fakeStore: {
  setKey: (key: 'hey' | 'you', value?: boolean | string) => void
} & WritableAtom<null>

listenKeys(fakeStore, ['hey', 'you'], () => {})

// THROWS is not assignable
listenKeys(fakeStore, ['unknownKey'], () => {})
