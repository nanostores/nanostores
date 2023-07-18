import type { ReadableAtom } from '../atom/index.js'
import type { AnyStore, Store, StoreValue } from '../map/index.js'

type StoreValues<Stores extends AnyStore[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

type A = ReadableAtom<number>
type B = ReadableAtom<string>

type C = (...values: StoreValues<[A, B]>) => void

interface Computed {
  <Value extends any, OriginStore extends Store>(
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
   */
  <Value extends any, OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Value
  ): ReadableAtom<Value>
}

export const computed: Computed

interface Batched {
  <Value extends any, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Value
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
  <Value extends any, OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Value
  ): ReadableAtom<Value>
}

export const batched: Batched
