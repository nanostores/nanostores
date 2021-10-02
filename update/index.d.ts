import {
  WritableStore,
  MapStoreKeys,
  StoreValue,
  MapStore
} from '../map/index.js'

/**
 * Shortcut to get the latest value of the store and update it to new one.
 *
 * ```js
 * import { update } from 'nanostores'
 *
 * function increment() {
 *   update(counter, value => value + 1)
 * }
 * ```
 *
 * @param store Store to update.
 * @param updater Callback to receive store’s value and return a new value.
 */
export function update<SomeStore extends WritableStore>(
  store: SomeStore,
  updater: (value: StoreValue<SomeStore>) => StoreValue<SomeStore>
): void

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
