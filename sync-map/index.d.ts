import { Action } from '@logux/core'

import { RemoteStore, loading, loaded } from '../store/index.js'

export const lastProcessed: unique symbol
export const lastChanged: unique symbol
export const offline: unique symbol
export const unbind: unique symbol

export type MapChangeAction<
  T extends string = '@logux/maps/change'
> = Action & {
  type: T
  id: string
  diff: {
    [key: string]: string | number
  }
}

export type MapChangedAction<
  T extends string = '@logux/maps/changed'
> = Action & {
  type: T
  id: string
  diff: {
    [key: string]: string | number
  }
}

type KeyToNeverOrKey<O, C> = {
  [K in keyof O]: O[K] extends C ? never : K
}

type RejectKeys<O, C> = KeyToNeverOrKey<O, C>[keyof O]

export type MapDiff<O extends object> = {
  [K in Exclude<RejectKeys<O, Function | object>, keyof SyncMap>]?: O[K]
}

/**
 * CRDT LWW Map with server validation. The best option for classic case
 * with server and many clients. Store will resolve client’s edit conflicts
 * with last write wins strategy.
 *
 * ```ts
 * import { SyncMap } from '@logux/state'
 *
 * export class User extends SyncMap {
 *   static plural = 'users'
 *   readonly name!: string
 *   readonly login!: string
 * }
 * ```
 */
export abstract class SyncMap extends RemoteStore {
  [loaded]: boolean;
  [loading]: Promise<void>

  /**
   * Should client load store from server and be ready
   * for `logux/undo` from server.
   */
  static remote: boolean

  /**
   * Should client keep offline cache for models in `localStorage`.
   *
   * ```js
   * import { SyncMap, offline } from '@logux/state'
   *
   * export class Posts extends SyncMap {
   *   static offline = true;
   * }
   * ```
   */
  static offline?: boolean

  /**
   * Plural store name. It will be used in action type and channel name.
   *
   * ```js
   * export class User extends SyncMap {
   *   static plural = 'users'
   * }
   * ```
   */
  static plural: string;

  /**
   * Should client keep offline cache for this store instance in `localStorage`.
   *
   * ```js
   * import { offline } from '@logux/state'
   *
   * cachePost(() => {
   *   post[offline] = true
   * })
   * ```
   */
  [offline]?: boolean

  /**
   * Change the key in the store.
   *
   * @param key Store key.
   * @param value New value.
   * @returns Promise until change will be applied on the server.
   */
  change<
    K extends Exclude<RejectKeys<this, Function | object>, keyof SyncMap>
  > (key: K, value: this[K]): Promise<void>
  change (diff: MapDiff<this>): Promise<void>
}
