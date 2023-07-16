import type { ReadableAtom, Task } from '../atom/index.js'
import type { AnyStore, Store, StoreValue } from '../map/index.js'

type StoreValues<Stores extends AnyStore[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

type A = ReadableAtom<number>
type B = ReadableAtom<string>

type C = (...values: StoreValues<[A, B]>) => void

interface Computed {
  /**
   * Create derived store, which use generates value from another stores.
   *
   * Pre-defined dependencies
   *
   * ```js
   * import { computed } from 'nanostores'
   *
   * import { $users } from './users.js'
   *
   * export const $admins = computed($users, users => {
   *   return users.filter(user => user.isAdmin)
   * })
   * ```
   *
   * Inline autosubscribe dependencies
   *
   * ```js
   * import { computed } from 'nanostores'
   *
   * import { $users } from './users.js'
   *
   * export const $admins = computed(() => {
   *   return $users().filter(user => user.isAdmin)
   * })
   * ```
   */
  <Value extends any, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => BoxTask<Value>
  ): ReadableAtom<UnboxTask<Value>>
  <Value extends any, OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => BoxTask<Value>
  ): ReadableAtom<UnboxTask<Value>>
  <Value extends any, T extends Task<Value> = Task<Value>>(
    cb: (task: T) => BoxTask<Value, T>
  ): ReadableAtom<UnboxTask<Value>>
}

export type BoxTask<Value, T extends Task<Value> = Task<Value>> =
  T | Value
export type UnboxTask<Value> = Value extends Task ? never : Value
export const computed: Computed
