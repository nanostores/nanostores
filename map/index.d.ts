import type {
  WritableAtom,
  ReadableAtom,
  ReadonlyIfObject,
  AllKeys,
} from '../atom/index.js'

type Get<T, K extends PropertyKey> = Extract<T, { [K1 in K]: any }>[K]

export type WritableStore<Value = any> =
  | WritableAtom<Value>
  | (Value extends object ? MapStore<Value> : never)

export type Store<Value = any> = ReadableAtom<Value> | WritableStore<Value>

export type AnyStore<Value = any> = { get(): Value }

export type StoreValue<SomeStore> = SomeStore extends {
  get(): infer Value
}
  ? Value
  : any

export type MapStoreKeys<TheStore extends MapStore> = AllKeys<
  StoreValue<TheStore>
>

export interface MapStore<Value extends object = any>
  extends WritableAtom<Value> {
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
      value: ReadonlyIfObject<Value>,
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
    listener: (
      value: ReadonlyIfObject<Value>,
      changedKey: AllKeys<Value>
    ) => void
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
