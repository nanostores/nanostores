export type MapStore<V extends object = any> = {
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
   * @param changedKey Key that was changed. Will by `undefined` on first call.
   * @returns Function to remove listener.
   */
  subscribe(
    listener: (value: Readonly<V>, changedKey: undefined | keyof V) => void
  ): () => void

  /**
   * Subscribe to store changes.
   *
   * In contrast with {@link Store#subscribe} it do not call listener
   * immediately.
   *
   * @param listener Callback with store value.
   * @param changedKey Key that was changed.
   * @returns Function to remove listener.
   */
  listen(
    listener: (value: Readonly<V>, changedKey: keyof V) => void
  ): () => void

  /**
   * Change store value.
   *
   * ```js
   * settings.set({ theme: 'dark' })
   * ```
   *
   * @param newValue New store value.
   */
  set(newValue: V): void

  /**
   * Change key in store value.
   *
   * ```js
   * settings.setKey('theme', 'dark')
   * ```
   *
   * @param key The key name.
   * @param value New value.
   */
  setKey<K extends keyof V>(key: K, value: V[K]): void

  /**
   * Notify listeners about changes in the store.
   *
   * ```js
   * value.list.clear()
   * store.notify('list')
   * ```
   *
   * @param key The key name.
   */
  notify(key: keyof V): void
}

/**
 * Create map store. Map store is a store with key-value object
 * as a store value.
 *
 * @param init Initialize store and return store destructor.
 * @returns The store object with methods to subscribe.
 */
export function createMap<V extends object, E = {}>(
  init?: () => void | (() => void)
): MapStore<V> & E
