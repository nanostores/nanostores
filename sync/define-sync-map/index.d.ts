import { SyncMapValues } from '@logux/actions'
import { Action, Meta } from '@logux/core'
import { Client } from '@logux/client'

import { MapBuilder } from '../../define-map/index.js'
import { MapStore } from '../../create-map/index.js'

interface SyncMapStoreExt {
  /**
   * Logux Client instance.
   */
  readonly client: Client

  /**
   * While store is loading initial data from server or log.
   */
  readonly loading: Promise<void>

  /**
   * Name of map class.
   */
  readonly plural: string

  /**
   * Does store keep data in the log after store is destroyed.
   */
  offline: boolean

  /**
   * Does store use server to load and save data.
   */
  remote: boolean

  /**
   * Meta from create action if the store was created locally.
   */
  createdAt?: Meta
}

export type LoadedSyncMapValue<Value extends SyncMapValues> = Value & {
  isLoading: false
  id: string
}

export type SyncMapValue<Value extends SyncMapValues> =
  | { isLoading: true; id: string }
  | LoadedSyncMapValue<Value>

export type SyncMapStore<Value extends SyncMapValues = any> = MapStore<
  SyncMapValue<Value>
> &
  SyncMapStoreExt

export interface SyncMapBuilder<Value extends SyncMapValues = any>
  extends MapBuilder<
    SyncMapValue<Value>,
    [Client] | [Client, Action, Meta, boolean | undefined],
    SyncMapStoreExt
  > {
  readonly plural: string
  offline: boolean
  remote: boolean
}

/**
 * CRDT LWW Map. It can use server validation or be fully offline.
 *
 * The best option for classic case with server and many clients.
 * Store will resolve client’s edit conflicts with last write wins strategy.
 *
 * ```ts
 * import { defineSyncMap } from '@logux/state/sync'
 *
 * export const User = defineSyncMap<{
 *   login: string,
 *   name?: string,
 *   isAdmin: boolean
 * }>('users')
 * ```
 *
 * @param plural Plural store name. It will be used in action type
 *               and channel name.
 * @param opts Options to disable server validation or keep actions in log
 *             for offline support.
 */
export function defineSyncMap<Value extends SyncMapValues>(
  plural: string,
  opts?: {
    offline?: boolean
    remote?: boolean
  }
): SyncMapBuilder<Value>

/**
 * Send create action to the server or to the log.
 *
 * Server will create a row in database on this action. {@link FilterStore}
 * will update the list.
 *
 * ```js
 * import { createSyncMap } from '@logux/state'
 *
 * showLoader()
 * await createSyncMap(client, User, {
 *   id: nanoid(),
 *   login: 'test'
 * })
 * hideLoader()
 * ```
 *
 * @param client Logux Client instance.
 * @param Builder Store class from {@link defineSyncMap}.
 * @param values Initial value.
 * @return Promise until server validation for remote classes
 *         or saving action to the log of fully offline classes.
 */
export function createSyncMap<Value extends SyncMapValues>(
  client: Client,
  Builder: SyncMapBuilder<Value>,
  values: Value & { id: string }
): Promise<void>

/**
 * Send create action and build store instance.
 *
 * ```js
 * import { buildNewSyncMap } from '@logux/state'
 *
 * let userStore = buildNewSyncMap(client, User, {
 *   id: nanoid(),
 *   login: 'test'
 * })
 * ```
 *
 * @param client Logux Client instance.
 * @param Builder Store class from {@link defineSyncMap}.
 * @param values Initial value.
 * @return Promise with store instance.
 */
export function buildNewSyncMap<Value extends SyncMapValues>(
  client: Client,
  Builder: SyncMapBuilder<Value>,
  values: Value & { id: string }
): Promise<SyncMapStore<Value>>

/**
 * Change store without store instance just by store ID.
 *
 * ```js
 * import { changeSyncMapById } from '@logux/state'
 *
 * let userStore = changeSyncMapById(client, User, 'user:4hs2jd83mf', {
 *   name: 'New name'
 * })
 * ```
 *
 * @param client Logux Client instance.
 * @param Builder Store class from {@link defineSyncMap}.
 * @param id Store’s ID.
 * @param diff Store’s changes.
 * @return Promise until server validation for remote classes
 *         or saving action to the log of fully offline classes.
 */
export function changeSyncMapById<Value extends SyncMapValues>(
  client: Client,
  Builder: SyncMapBuilder<Value>,
  id: string | { id: string },
  diff: Partial<Value>
): Promise<void>
export function changeSyncMapById<
  Value extends SyncMapValues,
  ValueKey extends keyof Value
>(
  client: Client,
  Builder: SyncMapBuilder<Value>,
  id: string | { id: string },
  key: ValueKey,
  value: Value[ValueKey]
): Promise<void>

/**
 * Change keys in the store’s value.
 *
 * ```js
 * import { changeSyncMap } from '@logux/state'
 *
 * showLoader()
 * await changeSyncMap(userStore, { name: 'New name' })
 * hideLoader()
 * ```
 *
 * @param store Store’s instance.
 * @param diff Store’s changes.
 * @return Promise until server validation for remote classes
 *         or saving action to the log of fully offline classes.
 */
export function changeSyncMap<Value extends SyncMapValues>(
  store: SyncMapStore<Value>,
  diff: Partial<Omit<Value, 'id'>>
): Promise<void>
export function changeSyncMap<
  Value extends SyncMapValues,
  ValueKey extends Exclude<keyof Value, 'id'>
>(
  store: SyncMapStore<Value>,
  key: ValueKey,
  value: Value[ValueKey]
): Promise<void>

/**
 * Delete store without store instance just by store ID.
 *
 * ```js
 * import { deleteSyncMapById } from '@logux/state'
 *
 * showLoader()
 * deleteSyncMapById(client, User, 'user:4hs2jd83mf')
 * ```
 *
 * @param client Logux Client instance.
 * @param Builder Store class from {@link defineSyncMap}.
 * @param id Store’s ID.
 * @return Promise until server validation for remote classes
 *         or saving action to the log of fully offline classes.
 */
export function deleteSyncMapById(
  client: Client,
  Builder: SyncMapBuilder,
  id: string | { id: string }
): Promise<void>

/**
 * Delete store.
 *
 * ```js
 * import { deleteSyncMapById } from '@logux/state'
 *
 * showLoader()
 * deleteSyncMapById(client, User, 'user:4hs2jd83mf')
 * ```
 *
 * @param store Store’s instance.
 * @return Promise until server validation for remote classes
 *         or saving action to the log of fully offline classes.
 */
export function deleteSyncMap(store: SyncMapStore): Promise<void>
