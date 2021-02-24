import { Action, Meta } from '@logux/core'
import { Client } from '@logux/client'

import { MapBuilder } from '../define-map/index.js'
import { MapStore } from '../create-map/index.js'

type SyncMapValues = {
  [key: string]: string | number | boolean | undefined
}

type SyncMapStoreExt = {
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

export type LoadedSyncMapValue<V extends SyncMapValues> = V & {
  isLoading: false
  id: string
}

export type SyncMapValue<V extends SyncMapValues> =
  | { isLoading: true; id: string }
  | LoadedSyncMapValue<V>

export type SyncMapStore<V extends SyncMapValues = any> = MapStore<
  SyncMapValue<V>
> &
  SyncMapStoreExt

export type SyncMapBuilder<V extends SyncMapValues = any> = MapBuilder<
  SyncMapValue<V>,
  [Client] | [Client, Action, Meta],
  SyncMapStoreExt
> & {
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
 * import { defineSyncMap } from '@logux/state'
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
export function defineSyncMap<V extends SyncMapValues> (
  plural: string,
  opts?: {
    offline?: boolean
    remote?: boolean
  }
): SyncMapBuilder<V>

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
export function createSyncMap<V extends SyncMapValues> (
  client: Client,
  Builder: SyncMapBuilder<V>,
  values: V & { id: string }
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
export function buildNewSyncMap<V extends SyncMapValues> (
  client: Client,
  Builder: SyncMapBuilder<V>,
  values: V & { id: string }
): Promise<SyncMapStore<V>>

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
export function changeSyncMapById<V extends SyncMapValues> (
  client: Client,
  Builder: SyncMapBuilder<V>,
  id: string | { id: string },
  diff: Partial<V>
): Promise<void>
export function changeSyncMapById<V extends SyncMapValues, K extends keyof V> (
  client: Client,
  Builder: SyncMapBuilder<V>,
  id: string | { id: string },
  key: K,
  value: V[K]
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
export function changeSyncMap<V extends SyncMapValues> (
  store: SyncMapStore<V>,
  diff: Partial<Omit<V, 'id'>>
): Promise<void>
export function changeSyncMap<
  V extends SyncMapValues,
  K extends Exclude<keyof V, 'id'>
> (store: SyncMapStore<V>, key: K, value: V[K]): Promise<void>

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
export function deleteSyncMapById (
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
export function deleteSyncMap (store: SyncMapStore): Promise<void>
