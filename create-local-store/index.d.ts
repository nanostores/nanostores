import { Client } from '@logux/client'

import { LocalStoreClass } from '../store/index.js'

/**
 * Create local store, call `listener` and call `listener` again
 * on any store changes.
 *
 * Object space tracks store listener and will destroy a store, when
 * all listeners will be unsibscribed.
 *
 * ```js
 * import { createRemoteStore } from '@logux/state'
 *
 * const unbind = createLocalStore(client, Router, current => {
 *   if (current.page === '/signout') {
 *     unbind()
 *     client.destroy()
 *     location.href = '/'
 *   } else {
 *     renderPage(current.page)
 *   }
 * })
 * ```
 *
 * @param client Cache of stores.
 * @param StoreClass Class of the local store.
 * @param listener Callback to be called right now and on any store changes.
 * @returns Unsubscribe function.
 */
export function createLocalStore<T extends LocalStoreClass> (
  client: Client,
  StoreClass: T,
  listener: (store: InstanceType<T>) => void
): () => void
