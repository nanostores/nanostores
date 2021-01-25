import { Client } from '@logux/client'

import { Store, AnyClass } from '../store/index.js'

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
 * import { RemoteStore } from '@logux/state'
 *
 * export class LocalStorageStore extends RemoteStore {
 *   constructor (id) {
 *     super(id)
 *     this.value = localStorage.getItem(this.id)
 *     this.storeLoading = Promise.resolve()
 *   }
 *
 *   change (value) {
 *     this.changeKey('value', value)
 *     localStorage.setItem(this.id, value)
 *   }
 * }
 * ```
 */
export abstract class RemoteStore extends Store {
  /**
   * Map of all stores of this class, which is using by application right now.
   */
  static loaded: Map<string, RemoteStore> | undefined

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
  readonly id: string

  /**
   * Store is still loading.
   */
  isLoading: boolean

  /**
   * Promise until store will be loaded from source.
   */
  abstract storeLoading: Promise<void>

  /**
   * @param id Store ID.
   * @param client Optional Logux client.
   */
  constructor (id: string, client?: Client)

  /**
   * Notify listeners about `diff` changes in store.
   *
   * @param key Store property name.
   * @param value New value.
   */
  notifyListener<K extends keyof this> (key: K, value: this[K]): void
}

export type RemoteStoreConstructor<S extends RemoteStore = RemoteStore> = new (
  id: string,
  client?: Client
) => S

export type RemoteStoreClass<
  S extends RemoteStore = RemoteStore
> = RemoteStoreConstructor<S> & {
  load(i: string, c?: Client): S
  loaded?: Map<string, S>
}
