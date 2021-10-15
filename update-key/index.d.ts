import { MapStoreKeys, StoreValue, MapStore } from '../map/index.js'

/**
 * Shortcut to update specific key in map store.
 *
 * ```js
 * import { updateKey } from 'nanostores'
 *
 * function changeNameCase(user) {
 *   updateKey(user, 'name', name => name.toUpperCase())
 * }
 * ```
 *
 * @param store Map store to update.
 * @param key Store’s key.
 * @param updater Callback to receive key’s value and return a new value.
 */
export function updateKey<
  SomeStore extends MapStore,
  Key extends MapStoreKeys<SomeStore>
>(
  store: SomeStore,
  key: Key,
  updater: (value: StoreValue<SomeStore>[Key]) => StoreValue<SomeStore>[Key]
): void
