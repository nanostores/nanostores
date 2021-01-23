import { OptionalKeys, StoreListener, StoreDiff } from '../store/index.js'
import { LocalStore, LocalStoreConstructor } from '../local-store/index.js'

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

  static subscribe<C extends LocalStoreConstructor> (
    this: C,
    listener: StoreListener<InstanceType<C>, StoreDiff<InstanceType<C>>>
  ): () => void
  subscribe (listener: StoreListener<this, StoreDiff<this>>): () => void
  addListener (listener: StoreListener<this, StoreDiff<this>>): () => void

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
  change<K extends keyof this> (key: K, value: this[K]): void

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
