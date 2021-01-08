import { Store } from '../store/index.js'

interface Connect {
  <C extends Store, S extends [Store, ...Store[]]>(
    current: C,
    input: S,
    callback: (...stores: S) => object
  ): void
  <C extends Store, S extends Store>(
    current: C,
    input: S,
    callback: (store: S) => object
  ): void
}

/**
 *
 * ```js
 * import { LocalStore, connect } from '@logux/state'
 *
 *
 * ```
 *
 * @param current The current store.
 * @param input Store or stores to connect with current store.
 * @param callback Callback on `from` stores changes.
 */
export const connect: Connect
