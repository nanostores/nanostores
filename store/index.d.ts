import { Emitter } from 'nanoevents'
import { Client } from '@logux/client'

export const loguxClient: unique symbol
export const listeners: unique symbol
export const emitter: unique symbol
export const loading: unique symbol
export const destroy: unique symbol
export const loaded: unique symbol

/**
 * Base store class to be used in `LocalStore` and `RemoteStore`.
 */
export abstract class Store {
  /**
   * The storage stores cache and optionally action log.
   *
   * ```js
   * import { loguxClient } from '@logux/state'
   *
   * …
   *     this[loguxClient].sync(action, type)
   * …
   * ```
   */
  [loguxClient]: Client;

  /**
   * Store events.
   *
   * ```js
   * import { Store, emitter } from '@logux/state'
   *
   * …
   *     this[emitter].emit('change', this)
   * …
   * ```
   */
  [emitter]: Emitter;

  /**
   * Number of store listener to destroy store, when all listeners
   * will be unsubscribed.
   */
  [listeners]: number

  /**
   * Store can optionally define callback to be called when there is
   * no listeners anymore.
   *
   * ```js
   * import { Store, destroy } from '@logux/state'
   *
   * class Router extends Store {
   *   [destroy] () {
   *     this.unbindDomListeners()
   *   }
   * }
   * ```
   */
  [destroy] (): void
}

/**
 * Abstract class for local store.
 *
 * Local store is singleton and initilizes immediately.
 * For instance, URL router is a local store.
 *
 * ```js
 * import { LocalStore, destroy, emitter } from '@logux/state'
 *
 * export class Router extends LocalStore {
 *   constructor (client) {
 *     super(client)
 *
 *     this.path = location.pathname
 *     this.popstate = () => {
 *       this.path = location.pathname
 *       this[emitter].emit('change', this)
 *     }
 *
 *     window.addEventListener('popstate', this.popstate)
 *   }
 *
 *   [destroy] () {
 *     window.removeEventListener('popstate', this.popstate)
 *   }
 * }
 */
export abstract class LocalStore extends Store {
  /**
   * @param client Cache of stores.
   */
  constructor (client: Client)
}

export type LocalStoreClass<S extends LocalStore = LocalStore> = new (
  client: Client
) => S

/**
 * Abstract class for remote stores. Remote store is a state for item,
 * which you load from some source.
 *
 * Not all remote stores is loading from server. Some can load data from local
 * Indexed DB.
 *
 * Remote store should have unique IDs accorss the system,
 * not just accorss remote store with the same type.
 * Use Nano ID or prefix like `user:10`.
 *
 * ```js
 * import { RemoteStore, loaded, loading, emitter } from '@logux/state'
 *
 * export class LocalStorageStore extends RemoteStore {
 *   constructor (client, id) {
 *     super(client, id)
 *     this.value = localStorage.getItem(this.id)
 *     this[loaded] = true
 *     this[loading] = Promise.resolve()
 *   }
 *
 *   change (value) {
 *     this.value = value
 *     localStorage.setItem(this.id, value)
 *     this[emitter].emit('change', this)
 *   }
 * }
 * ```
 */
export abstract class RemoteStore extends Store {
  /**
   * Store ID.
   */
  id: string;

  /**
   * Store was successfuly loaded from source.
   */
  abstract [loaded]: boolean;

  /**
   * Promise until store will be loaded from source.
   */
  abstract [loading]: Promise<void>

  /**
   * @param client Cache of stores.
   * @param id Store ID.
   */
  constructor (client: Client, id: string)
}

export type RemoteStoreClass<S extends RemoteStore = RemoteStore> = new (
  client: Client,
  id: string
) => S
