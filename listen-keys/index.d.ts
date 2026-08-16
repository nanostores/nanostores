import type { MapStoreKeys, StoreValue } from '../map/index.js'

/**
 * Listen for specific keys of the store.
 *
 * In contrast with {@link subscribeKeys} it do not call listener
 * immediately.
 * ```js
 * import { listenKeys } from 'nanostores'
 *
 * listenKeys($page, ['blocked'], (value, oldValue, changed) => {
 *   if (value.blocked) {
 *     console.log('You has no access')
 *   }
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
  keys: readonly MapStoreKeys<SomeStore>[],
  listener: (
    value: StoreValue<SomeStore>,
    oldValue: StoreValue<SomeStore> | undefined,
    changed: MapStoreKeys<SomeStore> | undefined
  ) => void
): () => void

/**
 * Listen for specific keys of the store and call listener immediately.
 * Note that the oldValue and changed arguments in the listener are
 * undefined during the initial call.
 *
 * ```js
 * import { subscribeKeys } from 'nanostores'
 *
 * subscribeKeys($page, ['blocked'], (value, oldValue, changed) => {
 *   if (value.blocked) {
 *     console.log('You has no access')
 *   }
 * })
 * ```
 *
 * @param $store The store to listen.
 * @param keys The keys to listen.
 * @param listener Standard listener.
 */
export function subscribeKeys<
  SomeStore extends { setKey: (key: any, value: any) => void }
>(
  $store: SomeStore,
  keys: readonly MapStoreKeys<SomeStore>[],
  listener: (
    value: StoreValue<SomeStore>,
    oldValue: StoreValue<SomeStore> | undefined,
    changed: MapStoreKeys<SomeStore> | undefined
  ) => void
): () => void
