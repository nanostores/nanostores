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
   *
   * Async
   *
   * Supports reentrant async callbacks with a {@link Task} to set intermediate value & checking if the task is `.stale()`.
   *
   * ```js
   * import { computed } from 'nanostores'
   *
   * import { $userId } from './users.js'
   *
   * computed(async task => {
   *   let user =
   *     await fetch(`https://api.com/users/${userId()}`)
   *     .then(response => response.json())
   *   if (task.stale()) return // cancel cb run if the cb is stale. return value is ignored if stale
   *   let messages =
   *     await fetch(`https://api.com/users/${$userId()}/messages`)
   *           .then(response => response.json())
   *   return { user, messages } // This will be ignored if the cb is stale & set if the cb is fresh
   * })
   * ```
   *
   * A returned Promise's `.then()` is called. If you would like the `$computed` to have a Promise value, you could wrap the Promise in an object.
   *
   * ```js
   * import { computed } from 'nanostores'
   *
   * import { $userId } from './users.js'
   *
   * computed(() => {
   *   return {
   *     promise:
   *       fetch(`https://api.com/users/${$userId()}`)
   *       .then(response => response.json())
   *   }
   * })
   * ```
   */
  <Value extends any, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => BoxTask<Value> | PromiseLike<BoxTask<Value>>
  ): ReadableAtom<UnboxTask<Awaited<Value>>>
  <Value extends any, OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => BoxTask<Value> | PromiseLike<BoxTask<Value>>
  ): ReadableAtom<UnboxTask<Awaited<Value>>>
  <Value extends any, T extends Task<Value> = Task<Value>>(
    cb: (task: T) => BoxTask<Value, T> | PromiseLike<BoxTask<Value, T>>
  ): ReadableAtom<UnboxTask<Awaited<Value>>>
}

export type BoxTask<Value, T extends Task<Value> = Task<Value>> =
  T | Value
export type UnboxTask<Value> = Value extends Task ? never : Value
export const computed: Computed
