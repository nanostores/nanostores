import { Action } from '@logux/core'

import { loading, loaded } from '../symbols/index.js'
import { RemoteStore } from '../store/index.js'

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

type Class<T> = { new (...args: any[]): T }

type KeyToNeverOrKey<O, C> = {
  [K in keyof O]: O[K] extends C ? never : K
}

type RejectKeys<O, C> = KeyToNeverOrKey<O, C>[keyof O]

export type MapDiff<O extends object> = {
  [K in Exclude<RejectKeys<O, Function | object>, keyof RemoteMap>]?: O[K]
}

/**
 * CRDT LWW Map with server validation. The best option for classic case
 * with server and many clients. Store will resolve client’s edit conflicts
 * with last write wins strategy.
 *
 * ```ts
 * import { RemoteMap } from '@logux/state'
 *
 * export class User extends RemoteMap {
 *   static plural = 'users'
 *   readonly name: string
 *   readonly login: string
 * }
 * ```
 */
export abstract class RemoteMap extends RemoteStore {
  [loaded]: boolean;
  [loading]: Promise<void>

  /**
   * Plural store name. It will be used in action type and channel name.
   *
   * ```js
   * export class User extends RemoteMap {
   *   plural = 'users'
   * }
   * ```
   */
  static readonly plural: string

  /**
   * Change the key in the store.
   *
   * @param key Store key.
   * @param value New value.
   * @returns Promise until change will be applied on the server.
   */
  change<
    K extends Exclude<RejectKeys<this, Function | object>, keyof RemoteMap>
  > (key: K, value: this[K]): Promise<void>
  change (diff: MapDiff<this>): Promise<void>
}
