import { LocalStore, RejectKeys } from '../store/index.js'

type OptionalKeys<O> = {
  [K in keyof O]-?: O[K] extends NonNullable<O[K]> ? never : K
}[keyof O]

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
  change<
    K extends Exclude<RejectKeys<this, Function | object>, keyof PersistentMap>
  > (key: K, value: this[K]): void

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
