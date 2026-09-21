import type { Getter, StoreValues } from '../computed/index.js'
import type { ListenableStore, StoreValue } from '../index.js'

interface Effect {
  <OriginStore extends ListenableStore>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => (() => void) | void
  ): () => void
  /**
   * Subscribe for multiple stores. Also you can define cleanup function
   * to call on stores changes.
   *
   * ```js
   * const $enabled = atom(true)
   * const $interval = atom(1000)
   *
   * const cancelPing = effect([$enabled, $interval], (enabled, interval) => {
   *   if (!enabled) return
   *   const intervalId = setInterval(() => {
   *     sendPing()
   *   }, interval)
   *   return () => {
   *     clearInterval(intervalId)
   *   }
   * })
   * ```
   */
  <OriginStores extends readonly ListenableStore[]>(
    stores: readonly [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => (() => void) | void
  ): () => void
  /**
   * Run callback and subscribe to stores, which was read by `get()`
   * in the last call. Also you can define cleanup function to call
   * before the next call.
   *
   * ```js
   * const cancelPing = effect(get => {
   *   if (!get($enabled)) return
   *   const intervalId = setInterval(() => {
   *     sendPing()
   *   }, get($interval))
   *   return () => {
   *     clearInterval(intervalId)
   *   }
   * })
   * ```
   *
   * `$store.get()` inside the callback reads a value without subscription.
   * Return the `stop` function of an effect created inside the callback
   * to stop it before the next call.
   */
  (cb: (get: Getter<ListenableStore>) => (() => void) | void): () => void
}

export const effect: Effect
