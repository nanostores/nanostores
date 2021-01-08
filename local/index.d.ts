import { LocalStore, LocalStoreClass } from '../local-store/index.js'

export class SimpleStore<V> extends LocalStore {
  readonly value: V
  change (value: V): void
}

export type SimpleStoreOptions<V> = {
  init?: (store: SimpleStore<V>) => void
  destroy?: (store: SimpleStore<V>) => void
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
 * @param initial Initial value.
 * @param opts Callbacks on store creating and destroying.
 * @returns Store class.
 */
export function local<V> (
  initial: V,
  opts?: SimpleStoreOptions<V>
): LocalStoreClass<SimpleStore<V>>
