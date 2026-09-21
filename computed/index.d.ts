import type { ReadableAtom } from '../atom/index.js'
import type {
  Gettable,
  ListenableStore,
  Store,
  StoreValue
} from '../map/index.js'
import type { Task } from '../task/index.js'

export type StoreValues<Stores extends readonly Gettable[]> = {
  -readonly [Index in keyof Stores]: StoreValue<Stores[Index]>
}

/**
 * Reads store value and subscribes `computed` or `effect` to this store.
 *
 * Call it only synchronously inside the callback. A later call throws
 * an error in development. Use `$store.get()` to read a value without
 * subscription.
 */
export type Getter<Source extends ListenableStore = Store> = <
  SomeStore extends Source
>(
  store: SomeStore
) => StoreValue<SomeStore>

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
  /**
   * Create derived store, which finds stores to subscribe during the callback.
   * It subscribes only to stores, which was read by `get()` in the last call.
   *
   * ```js
   * import { computed } from 'nanostores'
   *
   * import { $isDraft, $review } from './pull-request.js'
   *
   * export const $badge = computed(get => {
   *   if (get($isDraft)) return 'Draft'
   *   return get($review) === 'changes' ? 'Changes requested' : 'Ready'
   * })
   * ```
   *
   * `$store.get()` inside the callback reads a value without subscription.
   */
  <Value>(cb: (get: Getter) => Value): ReadableAtom<Value>
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
  /**
   * Create derived store, which finds stores to subscribe during the callback
   * and waits for the end of the tick before an update.
   *
   * ```js
   * import { batched } from 'nanostores'
   *
   * export const $link = batched(get => {
   *   return `/api/entities?sortBy=${get($sortBy)}&category=${get($category)}`
   * })
   * ```
   */
  <Value>(cb: (get: Getter) => Value): ReadableAtom<Value>
}

export const batched: Batched
