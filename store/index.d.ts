export const listeners: unique symbol
export const subscribe: unique symbol
export const destroy: unique symbol
export const change: unique symbol

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

export type StoreListener<S extends Store> = (
  store: S,
  diff: { [K in keyof S]?: S[K] }
) => void

/**
 * Base store class to be used in `LocalStore` and `RemoteStore`.
 */
export abstract class Store {
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
   * @return Function which will remove listener.
   */
  [subscribe] (listener: StoreListener<this>): () => void

  /**
   * Change store’s key and notify all listeners.
   *
   * ```js
   *
   * ```
   *
   * @param key Store property name.
   * @param value New value.
   */
  protected [change]<K extends keyof this> (key: K, value: this[K]): void
}
