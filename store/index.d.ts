export type RejectKeys<O, C> = {
  [K in keyof O]-?: O[K] extends C ? never : K
}[keyof O]

export type OptionalKeys<O> = {
  [K in keyof O]-?: O[K] extends NonNullable<O[K]> ? never : K
}[keyof O]

export type StoreDiff<S extends Store> = {
  [K in keyof S]?: S[K]
}

export type AnyClass = new (...args: any) => any

export type StoreListener<S extends Store> = (
  store: S,
  diff: StoreDiff<S>
) => void

/**
 * Base store class to be used in `LocalStore` and `RemoteStore`.
 */
export abstract class Store {
  /**
   * Subscribe for store changes and call listener immediately.
   *
   * ```js
   * let unbind = store.subscribe((store, changed) => {
   *   …
   * })
   * ```
   *
   * @param listener Callback with store instance and list of changed keys.
   * @return Function which will remove listener.
   */
  subscribe (listener: StoreListener<this>): () => void

  /**
   * Subscribe for store changes.
   *
   * In contrast to `subscribe()` it will not call listener immediately.
   *
   * @param listener Callback with store instance and list of changed keys.
   * @return Function which will remove listener.
   */
  addListener (listener: StoreListener<this>): () => void

  /**
   * Store can optionally define callback to be called when there is
   * no listeners anymore.
   *
   * ```js
   * import { Store } from '@logux/state'
   *
   * class Router extends Store {
   *   destroy () {
   *     this.unbindDomListeners()
   *   }
   * }
   * ```
   */
  destroy (): void

  /**
   * Change store’s key and notify all listeners.
   *
   * ```js
   * store.changeKey(key, value)
   * ```
   *
   * @param key Store property name.
   * @param value New value.
   */
  changeKey<K extends keyof this> (key: K, value: this[K]): void
}

export type StoreConstructor<S extends Store = Store> = new (...args: any) => S
