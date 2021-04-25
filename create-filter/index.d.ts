import { Client } from '@logux/client'

import {
  LoadedSyncMapValue,
  SyncMapBuilder,
  SyncMapValues,
  SyncMapStore
} from '../define-sync-map/index.js'
import { MapStore } from '../create-map/index.js'

export type Filter<Value extends object> = {
  [Key in keyof Value]?: Value[Key]
}

export interface FilterOptions {
  listChangesOnly?: boolean
}

export interface FilterStore<
  Value extends SyncMapValues = any
> extends MapStore<{
    list: LoadedSyncMapValue<Value>[]
    stores: Map<string, SyncMapStore<Value>>
    isEmpty: boolean
    isLoading: boolean
  }> {
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
export function createFilter<Value extends SyncMapValues>(
  client: Client,
  Builder: SyncMapBuilder<Value>,
  filter?: Filter<Value>,
  opts?: FilterOptions
): FilterStore<Value>
