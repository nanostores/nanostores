import { Emitter } from 'nanoevents'
import { Client } from '@logux/client'

type ObjectSpace =
  | Client
  | {
      objects: Map<string | ((...args: any) => object), object>
    }

/**
 * Base class to be used in store and model classes.
 */
export abstract class Store {
  /**
   * Each store much define own name.
   *
   * ```js
   * class Router extends LocalStore {
   *   static storeName = 'router'
   * }
   * ```
   */
  static storeName: string

  /**
   * Model marker.
   */
  static withId?: boolean

  /**
   * Local store marker.
   */
  static local?: boolean

  /**
   * @param client The storage to cache objects and optionally action log.
   */
  constructor (client: ObjectSpace)

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

export type StoreClass = new (client: ObjectSpace) => Store
