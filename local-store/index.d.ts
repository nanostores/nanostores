import { Client } from '@logux/client'

import { Store, StoreListener, AnyClass } from '../store/index.js'

/**
 * Abstract class for local store.
 *
 * Local store is singleton and initilizes immediately.
 * For instance, URL router is a local store.
 *
 * ```js
 * import { LocalStore, change } from '@logux/state'
 *
 * export class Router extends LocalStore {
 *   constructor (client) {
 *     super(client)
 *
 *     this.path = location.pathname
 *     this.popstate = () => {
 *       this[change]('path', location.pathname)
 *     }
 *
 *     window.addEventListener('popstate', this.popstate)
 *   }
 *
 *   destroy () {
 *     window.removeEventListener('popstate', this.popstate)
 *   }
 * }
 */
export abstract class LocalStore extends Store {
  /**
   * Instance of the store, if another part of application is using it.
   *
   * This methods should be used only in hacks. Use `Store.subscribe()` instead.
   */
  static loaded: LocalStore | undefined

  /**
   * Create new store or return already loaded.
   *
   * This methods should be used only in tests and hacks, because store will not
   * be destroyed. You should use `Store.subscribe()` instead.
   *
   * @param client Optional Logux client.
   */
  static load<C extends AnyClass> (this: C, client?: Client): InstanceType<C>

  /**
   * Shortcut to load store and subscribe to it changes.
   *
   * ```js
   * import { Router } from '~/store'
   *
   * Router.subscribe(router => {
   *   console.log(router.page)
   * })
   * ```
   *
   * @param listener Callback with store instance and list of changed keys.
   * @return Function which will remove listener.
   */
  static subscribe<C extends AnyClass> (
    this: C,
    listener: StoreListener<InstanceType<C>>
  ): () => void

  /**
   * @param client Optional Logux client.
   */
  constructor (client?: Client)
}

export type LocalStoreConstructor<S extends LocalStore = LocalStore> = new (
  client?: Client
) => S

export type LocalStoreClass<
  S extends LocalStore = LocalStore
> = LocalStoreConstructor<S> & {
  loaded?: S
  load(c?: Client): S
  subscribe(listener: StoreListener<S>): () => void
}
