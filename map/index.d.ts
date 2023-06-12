import type {
  AllKeys,
  ReadableAtom,
  ReadonlyIfObject,
  WritableAtom
} from '../atom/index.js'

type KeyofBase = keyof any

type Get<T, K extends KeyofBase> = Extract<T, { [K1 in K]: any }>[K]

export type WritableStore<Value = any> =
  | (Value extends object ? MapStore<Value> : never)
  | WritableAtom<Value>

export type Store<Value = any> = ReadableAtom<Value> | WritableStore<Value>

export type AnyStore<Value = any> = {
  get(): Value
  readonly value: undefined | Value
}

export type StoreValue<SomeStore> = SomeStore extends {
  get(): infer Value
}
  ? Value
  : any

export type BaseMapStore<Value = any> = WritableAtom<Value> & {
  setKey: (key: any, value: any) => any
}

export type MapStoreKeys<SomeStore> = SomeStore extends {
  setKey: (key: infer K, ...args: any[]) => any
}
  ? K
  : AllKeys<StoreValue<SomeStore>>

export interface MapStore<Value extends object = any>
  extends WritableAtom<Value> {
  /**
   * Subscribe to store changes.
   *
   * In contrast with {@link Store#subscribe} it do not call listener
   * immediately.
   *
   * @param listener Callback with store value.
   * @param changedKey Key that was changed. Will present only if `setKey`
   *                   has been used to change a store.
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
   * $settings.set({ theme: 'dark' })
   * ```
   *
   * Operation is atomic, subscribers will be notified once with the new value.
   * `changedKey` will be undefined
   *
   * @param newValue New store value.
   */
  set(newValue: Value): void

  /**
   * Change key in store value.
   *
   * ```js
   * $settings.setKey('theme', 'dark')
   * ```
   *
   * To delete key set `undefined`.
   *
   * ```js
   * $settings.setKey('theme', undefined)
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
   * Subscribe to store changes and call listener immediately.
   *
   * ```
   * import { $router } from '../store'
   *
   * $router.subscribe(page => {
   *   console.log(page)
   * })
   * ```
   *
   * @param listener Callback with store value.
   * @param changedKey Key that was changed. Will present only
   *                   if `setKey` has been used to change a store.
   * @returns Function to remove listener.
   */
  subscribe(
    listener: (
      value: ReadonlyIfObject<Value>,
      changedKey: AllKeys<Value> | undefined
    ) => void
  ): () => void
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

export interface MapCreator<
  Value extends object = any,
  Args extends any[] = []
> {
  (id: string, ...args: Args): MapStore<Value>
  cache: {
    [id: string]: MapStore<Value & { id: string }>
  }
}
