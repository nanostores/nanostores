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
 * Bind other stores changes to this one.
 *
 * ```js
 * import { LocalStore, connect, destroy } from '@logux/state'
 *
 * import { CurrentTime } from '../store'
 *
 * export ThisStore extends LocalStore {
 *   constructor () {
 *     this.start = Date.now()
 *     this.since = 0
 *     this[destroy] = connect(this, [CurrentTime], now => ({
 *       since: this.start - now.value
 *     }))
 *   }
 * }
 * ```
 *
 * @param current The current store.
 * @param input Store or stores to connect with current store.
 * @param callback Callback on `from` stores changes.
 */
export const connect: Connect
