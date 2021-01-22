import { LocalStore, LocalStoreClass } from '../local-store/index.js'

export class SimpleStore<V> extends LocalStore {
  readonly value: V
  set (value: V): void
}

/**
 * Shortcut to create local store with single value and without methods.
 *
 * ```js
 * import { local } from '@logux/state'
 *
 * let interval
 * export const CurrentTime = local(Date.now(), {
 *   init (now) {
 *     interval = setInterval(now.change(Date.now()), 1000)
 *   },
 *   destroy (now) {
 *     clearInterval(interval)
 *   }
 * })
 * ```
 *
 * See `local()` for syntax sugar.
 *
 * @param initial Initial value.
 * @param init Initialization callback, which return destroy callback
 * @returns Store class.
 */
export function local<V> (
  initial: V,
  init?: (store: SimpleStore<V>) => undefined | (() => void)
): LocalStoreClass<SimpleStore<V>>
