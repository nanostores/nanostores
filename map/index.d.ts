type AllKeys<T> = T extends any ? keyof T : never
type Get<T, K extends PropertyKey> = Extract<T, { [K1 in K]: any }>[K]

export interface MapStore<Value extends object = any> {
  /**
   * Low-level access to store’s value. Can be empty without listeners.
   * It is better to always use {@link getValue}.
   */
  value: Value | undefined

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
    listener: (
      value: Readonly<Value>,
      changedKey: undefined | AllKeys<Value>
    ) => void
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
    listener: (value: Readonly<Value>, changedKey: AllKeys<Value>) => void
  ): () => void

  /**
   * Change store value.
   *
   * ```js
   * settings.set({ theme: 'dark' })
   * ```
   *
   * Operation is not atomic, subscribers will be notified on every
   * key update.
   *
   * To ensure atomicity you can set special property last
   *
   * ```js
   * settings.setKey('isLoading', true)
   * settings.set({ name: 'Hasan Çeleb', born: 1937 })
   * settings.setKey('isLoading', false)
   * ```
   *
   * @param newValue New store value.
   */
  set(newValue: Value): void

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
  setKey<Key extends AllKeys<Value>>(
    key: Key,
    value: Get<Value, Key> | Value[Key]
  ): void

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
  notify(key: AllKeys<Value>): void

  /**
   * Get store value.
   *
   * ```js
   * store.get()
   * ```
   *
   * @param value Store value.
   */
  get(): Value
}

/**
 * Create map store. Map store is a store with key-value object
 * as a store value.
 *
 * @param init Initialize store and return store destructor.
 * @returns The store object with methods to subscribe.
 */
export function map<Value extends object, StoreExt extends object = {}>(
  value?: Value
): MapStore<Value> & StoreExt
