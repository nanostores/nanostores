import { Store, ObjectSpace } from '../store/index.js'

/**
 * Abstract class for local store like URL router.
 *
 * ```js
 * import { LocalStore } from '@logux/state'
 *
 * export class Router extends LocalStore {
 *   static storeName = 'router'
 *
 *   constructor (client) {
 *     super(client)
 *     this.bindEvents()
 *   }
 *
 *   destroy () {
 *     this.unbindEvents()
 *   }
 * }
 * ```
 */
export abstract class LocalStore extends Store {
  static local: true
}

export type LocalStoreClass = new (client: ObjectSpace) => LocalStore
