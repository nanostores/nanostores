import { Client } from '@logux/client'

import {
  ClientLogStoreConstructor,
  ClientLogStore
} from '../client-log-store/index.js'
import { loaded, loading } from '../remote-store/index.js'
import { SyncMap, MapKey } from '../sync-map/index.js'

export type Filter<S extends SyncMap> = {
  [K in MapKey<S>]?: S[K]
}

/**
 *
 */
export class FilterStore<M extends SyncMap> extends ClientLogStore {
  /**
   *
   * @param StoreClass
   * @param filter
   */
  static filter<I extends SyncMap> (
    client: Client,
    StoreClass: ClientLogStoreConstructor<I>,
    filter?: Filter<I>
  ): FilterStore<I>

  [loaded]: boolean;
  [loading]: Promise<void>

  /**
   * Filtered items.
   */
  list: M[]

  /**
   *
   * @param StoreClass
   * @param filter
   */
  filter (StoreClass: ClientLogStoreConstructor<M>, filter?: Filter<M>): void
}
