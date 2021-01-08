import { Store } from '../store/index.js'

interface Connect {
  <C extends Store, S extends [Store, ...Store[]]>(
    to: C,
    from: S,
    callback: (...stores: S) => object
  ): void
  <C extends Store, S extends Store>(
    to: C,
    from: S,
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
 * @param to The current store.
 * @param from Store or stores to connect with current store.
 * @param callback Callback on `from` stores changes.
 */
export const connect: Connect
