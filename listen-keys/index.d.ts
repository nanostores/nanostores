import { MapStore, MapStoreKeys, StoreValue } from '../map/index.js'

/**
 * Listen for specific keys of the store.
 *
 * ```js
 * import { listenKeys } from 'nanostores'
 *
 * listenKeys(page, ['blocked'], () => {
 *   console.log('You has no access')
 * })
 * ```
 *
 * @param store The store to listen.
 * @param keys The keys to listen.
 * @param listener Standard listener.
 */
export function listenKeys<SomeStore extends MapStore>(
  store: SomeStore,
  keys: MapStoreKeys<SomeStore>[],
  listener: (
    value: StoreValue<SomeStore>,
    changed: MapStoreKeys<SomeStore> | undefined
  ) => void
): () => void
