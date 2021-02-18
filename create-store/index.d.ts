type ReadonlyIfObject<V> = V extends object ? Readonly<V> : V

export type StoreValue<S> = S extends Store<infer V> ? V : any

/**
 * Store object.
 */
export type Store<V = any> = {
  /**
   * Low-level access to store’s value. Can be empty without listeners.
   * It is better to always use {@link getValue}.
   */
  value: V | undefined

  /**
   * Subscribe to store changes and call listener immediately.
   *
   * ```
   * import { router } from '../store'
   *
   * router.subscribe(page => {
   *   console.log(page)
   * })
   * ```
   *
   * @param listener Callback with store value.
   * @returns Function to remove listener.
   */
  subscribe(listener: (value: ReadonlyIfObject<V>) => void): () => void

  /**
   * Subscribe to store changes.
   *
   * In contrast with {@link Store#subscribe} it do not call listener
   * immediately.
   *
   * @param listener Callback with store value.
   * @returns Function to remove listener.
   */
  listen(listener: (value: ReadonlyIfObject<V>) => void): () => void

  /**
   * Change store value.
   *
   * ```js
   * router.set({ path: location.pathname, page: parse(location.pathname) })
   * ```
   *
   * @param newValue New store value.
   */
  set(newValue: V): void
}

/**
 * Define simple (singleton) store.
 *
 * ```js
 * import { createStore } from '@logux/state'
 *
 * function parse () {
 *   router.set({ path: location.pathname, page: parse(location.pathname) })
 * }
 *
 * export const router = createStore(() => {
 *   parse()
 *   window.addEventListener('popstate', parse)
 *   () => {
 *     window.removeEventListener('popstate', parse)
 *   }
 * })
 * ```
 *
 * @param init Initialize store and return store destructor.
 * @returns The store object with methods to subscribe.
 */
export function createStore<V> (init?: () => void | (() => void)): Store<V>
