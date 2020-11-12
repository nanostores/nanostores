import { Emitter } from 'nanoevents'
import { Client } from '@logux/client'

import { listeners, emitter, loguxClient, destroy } from '../symbols/index.js'

/**
 * Base state class to be used in `Store` and `Model`.
 */
export abstract class BaseState {
  /**
   * The storage to cache objects and optionally action log.
   */
  [loguxClient]: Client;

  /**
   * Number of store listener to destroy store, when all listeners
   * will be unsubscribed.
   */
  [listeners]: number;

  /**
   * Store events.
   *
   * ```js
   * this.events.emit('change', this)
   * ```
   */
  [emitter]: Emitter

  /**
   * Store can optionally define callback to be called when there is
   * no listeners anymore.
   *
   * ```js
   * import { destroy } from '@logux/state'
   *
   * class Router extends LocalStore {
   *   static storeName = 'router'
   *
   *   [destroy] () {
   *     this.unbindDomListeners()
   *   }
   * }
   * ```
   */
  [destroy] (): void
}

/**
 * Abstract class for store.
 *
 * ```js
 * import { Store, destroy } from '@logux/state'
 *
 * export class Router extends Store {
 *   constructor (client) {
 *     super(client)
 *     // bind events
 *   }
 *
 *   [destroy] () {
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

export type StoreClass<S extends Store = Store> = new (client: Client) => S
