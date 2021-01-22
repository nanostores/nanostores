import { LoguxClientStoreConstructor } from '../logux-client-store/index.js'
import { RemoteStoreConstructor } from '../remote-store/index.js'
import { LocalStoreConstructor } from '../local-store/index.js'

/**
 * Call `destroy` for all loaded stores and remove store classes from the cache.
 *
 * ```js
 * import { cleanStores } from '@logux/state'
 *
 * afterEach(async () => {
 *   await cleanStores(Router, Settings, User)
 * })
 * ```
 *
 * @param StoreClasses Used store classes.
 * @return Promise for stores destroying.
 */
export function cleanStores (
  ...StoreClasses: (
    | LoguxClientStoreConstructor
    | RemoteStoreConstructor
    | LocalStoreConstructor
  )[]
): Promise<void>
