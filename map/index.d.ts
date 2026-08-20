import type {
  AllKeys,
  ReadableAtom,
  ReadonlyIfObject,
  WritableAtom
} from '../atom/index.js'

type KeyofBase = keyof any

type Get<T, K extends KeyofBase> = T extends any
  ? K extends keyof T
    ? T[K]
    : never
  : never

export type HasIndexSignature<T> = string extends keyof T ? true : false

export type ValueWithUndefinedForIndexSignatures<
  Value,
  Key extends KeyofBase
> = Value extends any
  ? HasIndexSignature<Value> extends true
    ? undefined | Get<Value, Key>
    : Get<Value, Key>
  : never

export type WritableStore<Value = any> =
  | (Value extends object ? MapStore<Value> : never)
  | WritableAtom<Value>

export type Store<Value = any> = ReadableAtom<Value> | WritableStore<Value>

export type Gettable<Value = any> = {
  get(): Value
}

export type AnyStore<Value = any> = Gettable<Value> & {
  readonly value: undefined | Value
}

export type ListenableStore<Value = any> = Gettable<Value> & {
  listen(listener: () => void): () => void
}

export type StoreValue<SomeStore> = SomeStore extends Gettable<infer Value>
  ? Value
  : any

export type BaseMapStore<Value = any> = {
  setKey: (key: any, value: any) => any
} & WritableAtom<Value>

export type MapStoreKeys<SomeStore> = SomeStore extends MapStore
  ? AllKeys<StoreValue<SomeStore>>
  : SomeStore extends { setKey: (key: infer K, ...args: any[]) => any }
    ? K
    : AllKeys<StoreValue<SomeStore>>

export interface MapStore<
  Value extends object = any
> extends WritableAtom<Value> {
  /**
   * Compares the previous and next values for a key on `setKey`.
   *
   * Returning `true` means the values are the same, so the store keeps the old
   * value and no listener is called.
   *
   * One function serves every key of the map, so the key name comes as the
   * third argument. The old value is `undefined` when the key is not in the map
   * yet.
   *
   * @remarks
   * Deleting an existing key skips the comparison and notifies either way.
   * Whole-value writes use {@link ReadableAtom#eq} instead.
   *
   * @default Object.is
   * @returns `true` if the values are equal, `false` otherwise.
   */
  eqKey<Key extends AllKeys<Value>>(
    oldValue: Get<Value, Key> | undefined,
    newValue: Get<Value, Key> | undefined,
    key: Key
  ): boolean

  /**
   * Subscribe to store changes.
   *
   * In contrast with {@link Store#subscribe} it do not call listener
   * immediately.
   *
   * @param listener Callback with store value and old value.
   * @param changedKey Key that changed, when the notification carries one.
   * @returns Function to remove listener.
   */
  listen(
    listener: (
      value: ReadonlyIfObject<Value>,
      oldValue: ReadonlyIfObject<Value> | undefined,
      changedKey: AllKeys<Value> | undefined
    ) => void
  ): () => void

  /**
   * Low-level method to notify listeners about changes in the store.
   *
   * Can cause unexpected behaviour when combined with frontend frameworks
   * that perform equality checks for values, such as React.
   */
  notify(oldValue?: ReadonlyIfObject<Value>, changedKey?: AllKeys<Value>): void

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
    value: ValueWithUndefinedForIndexSignatures<Value, Key>
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
   * @param listener Callback with store value and old value.
   * @param changedKey Key that changed, when the notification carries one.
   * @returns Function to remove listener.
   */
  subscribe(
    listener: (
      value: ReadonlyIfObject<Value>,
      oldValue: ReadonlyIfObject<Value> | undefined,
      changedKey: AllKeys<Value> | undefined
    ) => void
  ): () => void
}

export interface PreinitializedMapStore<
  Value extends object = any
> extends MapStore<Value> {
  readonly value: Value
}

/**
 * Create map store with an initial value. Map store is a store with
 * key-value object as a store value.
 *
 * @param value Initial store value.
 * @returns The store object with methods to subscribe.
 */
export function map<Value extends object, StoreExt extends object = object>(
  value: Value
): PreinitializedMapStore<Value> & StoreExt

/**
 * Create map store with no initial value, or one that may be missing.
 *
 * @param value Initial store value, if there is one.
 * @returns The store object with methods to subscribe.
 */
export function map<Value extends object, StoreExt extends object = object>(
  value?: Value
): PreinitializedMapStore<Partial<Value>> & StoreExt
