import type { StoreValues } from '../computed/index.d.ts'
import type { AnyStore, Store, StoreValue } from '../index.js'

interface Effect {
  <OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => void | VoidFunction
  ): VoidFunction
  /**
   *
   * Create effect, which subscribes to all stores and runs callback with their values on change in any of them.
   * Especially useful for side effects which must cleanup after themselves.
   *
   * ```js
   * const $isEnabled = atom(true)
   * const $interval = atom(1000)
   *
   * const cancelPing = effect([$isEnabled, $interval], (isEnabled, interval) => {
   *   if (!isEnabled) return
   *
   *   const intervalId = setInterval(() => sendPing(), interval)
   *
   *   return () => clearInterval(intervalId)
   * })
   * ```
   */
  <OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => void | VoidFunction
  ): VoidFunction
}

export const effect: Effect
