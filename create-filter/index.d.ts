import { Client } from '@logux/client'

import {
  LoadedSyncMapValue,
  SyncMapBuilder,
  SyncMapValues,
  SyncMapStore
} from '../define-sync-map/index.js'
import { MapStore } from '../create-map/index.js'

export type Filter<V extends object> = {
  [K in keyof V]?: V[K]
}

export type FilterOptions<V extends SyncMapValues> = {
  listChangesOnly?: boolean
  sortBy?: 'id' | keyof V | ((value: LoadedSyncMapValue<V>) => string | number)
}

export type FilterStore<V extends SyncMapValues = any> = MapStore<{
  list: LoadedSyncMapValue<V>[]
  stores: Map<string, SyncMapStore<V>>
  isEmpty: boolean
  isLoading: boolean
}> & {
  /**
   * While store is loading initial data from server or log.
   */
  readonly loading: Promise<void>
}

/**
 * Load list of `SyncMap` with simple key-value requirements.
 *
 * It will look for stores in loaded cache, log (for offline maps) and will
 * subscribe to list from server (for remote maps).
 *
 * ```js
 * import { createFilter, getValue } from '@logux/state'
 *
 * import { User } from '../store'
 *
 * let usersInProject = createFilter(client, User, { projectId })
 * await usersInProject.loading
 * console.log(getValue(usersInProject))
 * ```
 *
 * @param client Logux Client.
 * @param Builder Store class from {@link defineSyncMap}.
 * @param filter Key-value to filter stores.
 * @param opts Loading options.
 */
export function createFilter<V extends SyncMapValues>(
  client: Client,
  Builder: SyncMapBuilder<V>,
  filter?: Filter<V>,
  opts?: FilterOptions<V>
): FilterStore<V>
