import { Client, ChannelError } from '@logux/client'

import { RemoteStoreClass } from '../store/index.js'

/**
 * Load remote store from source, call `listener` and call `listener` again
 * on any store changes.
 *
 * It tracks store listener and will destroy a store,
 * when all listeners will be unsibscribed.
 *
 * ```js
 * import { loadRemoteStore } from '@logux/state'
 *
 * const unbind = loadStore(client, Users, 'users:10', user => {
 *   console.log(user.name)
 * }, error => {
 *   console.error(error)
 * })
 * ```
 *
 * @param client Cache of stores.
 * @param StoreClass Class of the remote store.
 * @param id Store ID.
 * @param listener Callback to be called after loading and on any store changes.
 * @param onChannelError Callback for any error during loading.
 * @returns Unsubscribe function.
 */
export function loadRemoteStore<T extends RemoteStoreClass> (
  client: Client,
  StoreClass: T,
  id: string,
  listener: (store: InstanceType<T>) => void,
  onChannelError: (error: ChannelError) => void
): () => void
