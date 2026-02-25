import type { ReadableAtom } from '../atom/index.js'
import type { AnyStore, Store, StoreValue } from '../map/index.js'

export type AsyncValue<T> =
  { changing: boolean; error: unknown, state: 'failed', }
  | { changing: boolean; state: 'loaded', value: T, }
  | { state: 'loading' }

export type AsyncComputedStore<Value> = {
  readonly async: true,
  readonly value: AsyncValue<Awaited<Value>>,
} & ReadableAtom<AsyncValue<Awaited<Value>>>

export type AsyncStoreValue<SomeStore> = SomeStore extends {
  get(): AsyncValue<infer Value>
}
  ? Value
  : StoreValue<SomeStore>

export type AsyncStoreValues<Stores extends AnyStore[]> = {
  [Index in keyof Stores]: AsyncStoreValue<Stores[Index]>
}

interface ComputedAsync {
  <Value, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: AsyncStoreValue<OriginStore>) => Value
  ): AsyncComputedStore<Value>
  /**
   * Create derived store, which use asynchronously generates value from another stores.
   *
   * ```js
   * import { computed, task } from 'nanostores'
   *
   * import { $userId } from './users.js'
   *
   * export const $user = computed($userId, userId => async () => {
   *   const response = await fetch(`https://my-api/users/${userId}`)
   *   return response.json()
   * })
   * ```
   *
   * The async callback is tracked as a {@link Task}, so {@link allTasks} can wait its completion.
   */
  <Value, OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: AsyncStoreValues<OriginStores>) => Value,
  ): AsyncComputedStore<Value>
}

export const computedAsync: ComputedAsync

interface ComputedAsyncNoCascade {
  <Value, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Value
  ): AsyncComputedStore<Value>
  /**
   * Create derived store, which use asynchronously generates value from another stores.
   *
   * ```js
   * import { computed, task } from 'nanostores'
   *
   * import { $userId } from './users.js'
   *
   * export const $user = computed($userId, userId => async () => {
   *   const response = await fetch(`https://my-api/users/${userId}`)
   *   return response.json()
   * })
   * ```
   *
   * The async callback is tracked as a {@link Task}, so {@link allTasks} can wait its completion.
   */
  <Value, OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Value,
  ): AsyncComputedStore<Value>
}

export const computedAsyncNoCascade: ComputedAsyncNoCascade
