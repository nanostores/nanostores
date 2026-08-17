import type { ReadableAtom } from '../atom/index.js'
import type { Gettable, Store, StoreValue } from '../map/index.js'
import type { Task } from '../task/index.js'

export type StoreValues<Stores extends readonly Gettable[]> = {
  -readonly [Index in keyof Stores]: StoreValue<Stores[Index]>
}

interface Computed {
  /**
   * @deprecated Use `@nanostores/async`.
   */
  <Value, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Task<Value>
  ): ReadableAtom<undefined | Value>
  /**
   * @deprecated Use `@nanostores/async`.
   */
  <Value, OriginStores extends readonly Store[]>(
    stores: readonly [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Task<Value>
  ): ReadableAtom<undefined | Value>
  <Value, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Value
  ): ReadableAtom<Value>
  /**
   * Create derived store, which use generates value from another stores.
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
   * Use `@nanostores/async` for async function.
   */
  <Value, OriginStores extends readonly Store[]>(
    stores: readonly [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Task<Value> | Value
  ): ReadableAtom<Value>
}

export const computed: Computed

interface Batched {
  <Value, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Task<Value> | Value
  ): ReadableAtom<Value>
  /**
   * Create derived store, which use generates value from another stores.
   *
   * ```js
   * import { batched } from 'nanostores'
   *
   * const $sortBy = atom('id')
   * const $category = atom('')
   *
   * export const $link = batched([$sortBy, $category], (sortBy, category) => {
   *   return `/api/entities?sortBy=${sortBy}&category=${category}`
   * })
   * ```
   */
  <Value, OriginStores extends readonly Store[]>(
    stores: readonly [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Task<Value> | Value
  ): ReadableAtom<Value>
}

export const batched: Batched
