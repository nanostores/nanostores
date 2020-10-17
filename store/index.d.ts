import { Emitter } from 'nanoevents'
import { Client } from '@logux/client'

/**
 * Base state class to be used in `Store` and `Model`.
 */
export abstract class BaseState {
  /**
   * Number of store listener to destroy store, when all listeners
   * will be unsubscribed.
   */
  listeners: number

  /**
   * Store events.
   *
   * ```js
   * this.events.emit('change', this)
   * ```
   */
  emitter: Emitter

  /**
   * Store can optionally define callback to be called when there is
   * no listeners anymore.
   *
   * ```js
   * class Router extends LocalStore {
   *   static storeName = 'router'
   *
   *   destroy () {
   *     this.unbindDomListeners()
   *   }
   * }
   * ```
   */
  destroy (): void
}

/**
 * Abstract class for store.
 *
 * ```js
 * import { Store } from '@logux/state'
 *
 * export class Router extends Store {
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
 */
export abstract class Store extends BaseState {
  id: undefined

  /**
   * @param client The storage to cache objects and optionally action log.
   */
  constructor (client: Client)
}

export type StoreClass = new (client: Client) => Store
