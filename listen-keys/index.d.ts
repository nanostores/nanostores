import type { StoreValue } from '../map/index.js'

/**
 * Listen for specific keys of the store.
 *
 * ```js
 * import { listenKeys } from 'nanostores'
 *
 * listenKeys($page, ['blocked'], () => {
 *   console.log('You has no access')
 * })
 * ```
 *
 * @param $store The store to listen.
 * @param keys The keys to listen.
 * @param listener Standard listener.
 */
export function listenKeys<
  SomeStore extends { setKey: (key: any, value: any) => void }
>(
  $store: SomeStore,
  keys: SomeStore extends { setKey: (key: infer Key, value: never) => unknown }
    ? readonly Key[]
    : never,
  listener: (
    value: StoreValue<SomeStore>,
    changed: SomeStore extends {
      setKey: (key: infer Key, value: never) => unknown
    }
      ? Key[]
      : never
  ) => void
): () => void
