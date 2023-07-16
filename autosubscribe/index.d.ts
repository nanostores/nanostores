import type { AnyStore } from '../map'
export let autosubscribeStack: Autosubscribe[]
export interface Autosubscribe {
  /**
   * Causes associated `$computed` to autosubscribe to the `$store`. Returns `$store.get()`.
   *
   * @param $store Store to autosubscribe to, returning `$store.get()`
   */
  <V>($store: AnyStore<V>): V
}
