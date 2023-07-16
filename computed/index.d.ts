import type { ReadableAtom } from '../atom/index.js'
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
    cb: (value: StoreValue<OriginStore>) => Value
  ): ReadableAtom<Value>
  <Value extends any, OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Value
  ): ReadableAtom<Value>
  <Value extends any>(
    cb: () => Value
  ): ReadableAtom<Value>
}

export const computed: Computed
