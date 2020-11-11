import { Action } from '@logux/core'

import { Model } from '../model/index.js'

export type MapChangeAction<
  T extends string = '@logux/maps/change'
> = Action & {
  type: T
  key: string
  value: string | number
}

export type MapChangedAction<
  T extends string = '@logux/maps/changed'
> = Action & {
  type: T
  key: string
  value: string | number
}

type Class<T> = { new (...args: any[]): T }

type KeyToNeverOrKey<O, C> = {
  [K in keyof O]: O[K] extends C ? never : K
}

type RejectKeys<O, C> = KeyToNeverOrKey<O, C>[keyof O]

/**
 * CRDT LWW Map with server validation. The best option for classic case
 * with server and many clients. Store will resolve client’s edit conflicts
 * with last write wins strategy.
 *
 * ```ts
 * import { RemoteMap } from '@logux/state'
 *
 * export class User extends RemoteMap {
 *   static modelsName = 'users'
 *
 *   readonly name: string
 *   readonly login: string
 * }
 * ```
 */
export abstract class RemoteMap extends Model {
  /**
   * Plural model name. It will be used in action type and channel name.
   *
   * ```js
   * export class User extends RemoteMap {
   *   modelsName = 'users'
   * }
   * ```
   */
  static readonly modelsName: string

  modelLoaded: boolean
  modelLoading: Promise<void>

  /**
   * Change the key in the model.
   *
   * @param key Model’s key.
   * @param value New value.
   * @returns Promise until change will be applied on the server.
   */
  change<
    K extends Exclude<RejectKeys<this, Function | object>, keyof RemoteMap>
  > (key: K, value: this[K]): Promise<void>
}
