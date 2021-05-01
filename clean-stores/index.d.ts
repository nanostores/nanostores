import { SyncMapBuilder } from '../sync/define-sync-map/index.js'
import { MapBuilder } from '../define-map/index.js'
import { Store } from '../create-store/index.js'

/**
 * Destroys all cached stores and remove store from the cache.
 *
 * ```js
 * import { cleanStores } from '@logux/state'
 *
 * afterEach(() => {
 *   cleanStores(Router, Settings, User)
 * })
 * ```
 *
 * @param stores Used store classes.
 * @return Promise for stores destroying.
 */
export function cleanStores(
  ...stores: (Store | MapBuilder | SyncMapBuilder)[]
): void
