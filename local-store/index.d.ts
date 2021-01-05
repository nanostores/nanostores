import { Emitter, Unsubscribe } from 'nanoevents'
import { Client } from '@logux/client'

export const listeners: unique symbol
export const subscribe: unique symbol
export const emitter: unique symbol
export const destroy: unique symbol

export type RejectKeys<O, C> = {
  [K in keyof O]-?: O[K] extends C ? never : K
}[keyof O]

export type OptionalKeys<O> = {
  [K in keyof O]-?: O[K] extends NonNullable<O[K]> ? never : K
}[keyof O]

export type StoreDiff<O extends object, C extends object> = {
  [K in Exclude<RejectKeys<O, Function | object>, keyof C>]?: O[K]
}

export type StoreKey<O extends object, C extends object> = Exclude<
  RejectKeys<O, Function | object>,
  keyof C
>

export type AnyClass = new (...args: any) => any

/**
 * Base store class to be used in `LocalStore` and `RemoteStore`.
 */
export abstract class Store {
  [emitter]: Emitter;

  /**
   * Number of store listener to destroy store, when all listeners
   * will be unsubscribed.
   */
  [listeners]: number

  /**
   * Store can optionally define callback to be called when there is
   * no listeners anymore.
   *
   * ```js
   * import { Store, destroy } from '@logux/state'
   *
   * class Router extends Store {
   *   [destroy] () {
   *     this.unbindDomListeners()
   *   }
   * }
   * ```
   */
  [destroy] (): void

  /**
   * Subscribe for store changes.
   *
   * ```js
   * import { subscribe } from '@logux/state'
   *
   * let unbind = store[subscribe]((store, changed) => {
   *   …
   * })
   * ```
   *
   * @param listener Callback with store instance and list of changed keys
   *                 (if acceptable).
   */
  [subscribe] (listener: (store: this, changed: object) => void): Unsubscribe
}

/**
 * Abstract class for local store.
 *
 * Local store is singleton and initilizes immediately.
 * For instance, URL router is a local store.
 *
 * ```js
 * import { LocalStore, destroy, triggerChanges } from '@logux/state'
 *
 * export class Router extends LocalStore {
 *   constructor (client) {
 *     super(client)
 *
 *     this.path = location.pathname
 *     this.popstate = () => {
 *       this.path = location.pathname
 *       triggerChanges(this)
 *     }
 *
 *     window.addEventListener('popstate', this.popstate)
 *   }
 *
 *   [destroy] () {
 *     window.removeEventListener('popstate', this.popstate)
 *   }
 * }
 */
export abstract class LocalStore extends Store {
  /**
   * Instance of the store, if another part of application is using it.
   */
  static loaded: LocalStore | undefined

  /**
   * Create new store or return already loaded.
   *
   * @param client Optional Logux client.
   */
  static load<C extends AnyClass> (this: C, client?: Client): InstanceType<C>

  /**
   * @param client Optional Logux client.
   */
  constructor (client?: Client)
}

export type LocalStoreClass<S extends LocalStore = LocalStore> = new (
  client?: Client
) => S

/**
 * Run all listeners subscribed to store changes.
 *
 * ```js
 * import { LocalStore, triggerChanges } from '@logux/state'
 *
 * class Store extends LocalStore {
 *   change (key, value) {
 *     this[key] = value
 *     triggerChanges(this, { [key]: value })
 *   }
 * }
 * ```
 *
 * @param store The store with changes.
 * @param changes Changed keys.
 */
export function triggerChanges (store: Store, changes?: object): void
