import { WritableAtom } from '../atom/index.js'
import { AllKeys, GetPath } from './path.js'

export * from './path.js'

type Listener<T extends Record<string, unknown>> = (
  listener: (value: T, changedKey: undefined | AllKeys<T>) => void
) => () => void

export type DeepMapStore<T extends Record<string, unknown>> = Omit<
  WritableAtom<T>,
  'setKey' | 'listen' | 'subscribe'
> & {
  setKey: <K extends AllKeys<T>>(key: K, value: GetPath<T, K>) => void
  listen: Listener<T>
  subscribe: Listener<T>
}

export function deepMap<T extends Record<string, unknown>>(
  initial?: T
): DeepMapStore<T>
