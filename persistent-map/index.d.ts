import { Unsubscribe } from 'nanoevents'

import {
  OptionalKeys,
  LocalStore,
  subscribe,
  StoreDiff,
  StoreKey
} from '../local-store/index.js'

/**
 * Store to keep data in `localStorage` and sync changes between browser tabs.
 *
 * ```js
 * import { PersistentMap } from '@logux/state'
 *
 * class Settings extends PersistentMap {
 *   static id = 'settings'
 *   theme?: 'dark' | 'light'
 * }
 * ```
 */
export class PersistentMap extends LocalStore {
  [subscribe] (
    listener: (store: this, diff: StoreDiff<this, PersistentMap>) => void
  ): Unsubscribe

  /**
   * Unique ID for the store to be used as `localStorage` keys prefix.
   *
   * ```js
   * class Settings extends PersistentMap {
   *   static id = 'settings'
   * }
   * ```
   */
  static id: string

  /**
   * Change the key in the store.
   *
   * ```js
   * settings.change('theme', 'dark')
   * ```
   *
   * @param key Store key.
   * @param value New value.
   */
  change<K extends StoreKey<this, PersistentMap>> (key: K, value: this[K]): void

  /**
   * Remove the key from the store if it can be `undefined`.
   *
   * ```js
   * settings.remove('theme')
   * ```
   *
   * @param key Store key.
   */
  remove<K extends Exclude<OptionalKeys<this>, keyof PersistentMap>> (
    key: K
  ): void
}
