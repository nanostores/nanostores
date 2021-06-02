import { MapBuilder, AnySyncBuilder } from '../define-map/index.js'
import { ReadableStore } from '../create-store/index.js'

/**
 * Add empty listener to the store to active store and prevent loosing store’s
 * value on no listeners.
 *
 * Together with {@link cleanStores} is useful tool for tests.
 *
 * ```js
 * import { keepActive } from 'nanostores'
 *
 * keepActive(store)
 * ```
 *
 * @param store The store.
 */
export function keepActive(
  store: ReadableStore | MapBuilder | AnySyncBuilder
): void
