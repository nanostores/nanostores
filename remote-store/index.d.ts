import { Client } from '@logux/client'

import { Store, AnyClass } from '../local-store/index.js'

export const loading: unique symbol
export const destroy: unique symbol
export const loaded: unique symbol

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
 *   constructor (id) {
 *     super(id)
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
   * Map of all stores of this class, which is using by application right now.
   */
  static loaded: Map<string, RemoteStore>

  /**
   * Create new store or return already loaded.
   *
   * @param id Store ID.
   * @param client Optional Logux client.
   */
  static load<C extends AnyClass> (
    this: C,
    id: string,
    client?: Client
  ): InstanceType<C>

  /**
   * Store ID.
   */
  readonly id: string;

  /**
   * Store was successfuly loaded from source.
   */
  abstract [loaded]: boolean;

  /**
   * Promise until store will be loaded from source.
   */
  abstract [loading]: Promise<void>

  /**
   * @param id Store ID.
   * @param client Optional Logux client.
   */
  constructor (id: string, client?: Client)
}

export type RemoteStoreClass<S extends RemoteStore = RemoteStore> = new (
  id: string,
  client?: Client
) => S
