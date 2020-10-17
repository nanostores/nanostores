import { Client } from '@logux/client'

import { StoreClass } from '../store/index.js'
import { ModelClass } from '../model/index.js'

interface Subscribe {
  <T extends ModelClass>(
    client: Client,
    Model: T,
    id: string,
    listener: (model: InstanceType<T>) => void
  ): () => void

  <T extends StoreClass>(
    client: Client,
    Store: T,
    listener: (model: InstanceType<T>) => void
  ): () => void
}

/**
 * Load store, call `listener` and call `listener` again on any store changes.
 *
 * Object space tracks model listener and will destroy a model, when
 * all listeners will be unsibscribed.
 *
 * ```js
 * const unbind = subscribe(client, Router, current => {
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
export const subscribe: Subscribe
