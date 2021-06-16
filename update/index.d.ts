import { ReadableStore, StoreValue } from '../create-store/index.js'
import { MapStore } from '../create-map/index.js'

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
export function update<Store extends ReadableStore>(
  store: Store,
  updater: (value: StoreValue<Store>) => StoreValue<Store>
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
  Store extends MapStore,
  Key extends keyof StoreValue<Store>
>(
  store: Store,
  key: Key,
  updater: (value: StoreValue<Store>[Key]) => StoreValue<Store>[Key]
): void
