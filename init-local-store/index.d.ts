import { Unsubscribe } from 'nanoevents'

import { LocalStoreClass } from '../local-store/index.js'
import { ObjectSpace } from '../store/index.js'

/**
 * Load store, call `listener` and call `listener` again on any store changes.
 *
 * Object space tracks model listener and will destroy a model, when
 * all listeners will be unsibscribed.
 *
 * ```js
 * const unbind = initLocalStore(client, Router, current => {
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
 * @param client Object space for all models and stores.
 * @param StoreClass Class of the store.
 * @param listener Callback to be called right now and on any store changes.
 * @returns Unsubscribe function.
 */
export function initLocalStore<T extends LocalStoreClass> (
  client: ObjectSpace,
  StoreClass: T,
  listener: (model: InstanceType<T>) => void
): Unsubscribe
