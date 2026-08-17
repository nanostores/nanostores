import type { StoreValues } from '../computed/index.js'
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
}

export const effect: Effect
