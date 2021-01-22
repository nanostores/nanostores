import { Client } from '@logux/client'

import {
  ClientLogStoreConstructor,
  ClientLogStore
} from '../client-log-store/index.js'
import { SyncMap, MapKey } from '../sync-map/index.js'
import { loading } from '../remote-store/index.js'

export type Filter<S extends SyncMap> = {
  [K in MapKey<S>]?: S[K]
}

/**
 * Store to load list of `SyncMap` with simple key-value requirements.
 *
 * It will look for stores in loaded cache, log (for offline maps) and will
 * subscribe to list from server (for remote maps).
 *
 * ```js
 * import { FilterStore, loading } from '@logux/state'
 *
 * import { User } from '../store'
 *
 * let users = FilterStore.filter(User, { projectId })
 * await users[loading]
 * console.log(users.list)
 * ```
 */
export class FilterStore<M extends SyncMap> extends ClientLogStore {
  /**
   * Shortcut to load store and start filtering.
   *
   * ```js
   * import { FilterStore, loading } from '@logux/state'
   *
   * import { User } from '../store'
   *
   * let users = FilterStore.filter(User, { projectId })
   * await users[loading]
   * console.log(users.list)
   * ```
   *
   * @param StoreClass
   * @param filter
   */
  static filter<I extends SyncMap> (
    client: Client,
    StoreClass: ClientLogStoreConstructor<I>,
    filter?: Filter<I>
  ): FilterStore<I>

  [loading]: Promise<void>

  /**
   * Filtered items.
   */
  list: M[]
}
