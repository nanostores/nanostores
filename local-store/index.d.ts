import { Client } from '@logux/client'

import { Store, AnyClass } from '../store/index.js'

/**
 * Abstract class for local store.
 *
 * Local store is singleton and initilizes immediately.
 * For instance, URL router is a local store.
 *
 * ```js
 * import { LocalStore, destroy, triggerChanges } from '@logux/state'
 *
 * export class Router extends LocalStore {
 *   constructor (client) {
 *     super(client)
 *
 *     this.path = location.pathname
 *     this.popstate = () => {
 *       this.path = location.pathname
 *       triggerChanges(this)
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
   * Instance of the store, if another part of application is using it.
   */
  static loaded: LocalStore | undefined

  /**
   * Create new store or return already loaded.
   *
   * @param client Optional Logux client.
   */
  static load<C extends AnyClass> (this: C, client?: Client): InstanceType<C>

  /**
   * @param client Optional Logux client.
   */
  constructor (client?: Client)
}

export type LocalStoreClass<S extends LocalStore = LocalStore> = new (
  client?: Client
) => S

export type LocalStoreClassWithStatic<
  S extends LocalStore = LocalStore
> = LocalStoreClass<S> & {
  load(c?: Client): S
  loaded?: S
}
