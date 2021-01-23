import {
  LocalStoreConstructor,
  LocalStoreClass,
  LocalStore
} from '../local-store/index.js'
import { StoreListener } from '../store/index.js'

export class SimpleStore<V> extends LocalStore {
  static subscribe<C extends LocalStoreConstructor<SimpleStore<any>>> (
    this: C,
    listener: StoreListener<
      InstanceType<C>,
      { value?: InstanceType<C>['value'] }
    >
  ): () => void
  readonly value: V
  subscribe (listener: StoreListener<this, { value?: V }>): () => void
  addListener (listener: StoreListener<this, { value?: V }>): () => void
  set (value: V): void
}

/**
 * Shortcut to create local store with single value and without methods.
 *
 * ```js
 * import { local } from '@logux/state'
 *
 * let interval
 * export const CurrentTime = local(Date.now(), {
 *   init (now) {
 *     interval = setInterval(now.change(Date.now()), 1000)
 *   },
 *   destroy (now) {
 *     clearInterval(interval)
 *   }
 * })
 * ```
 *
 * See `local()` for syntax sugar.
 *
 * @param initial Initial value.
 * @param init Initialization callback, which return destroy callback
 * @returns Store class.
 */
export function local<V> (
  initial: V,
  init?: (store: SimpleStore<V>) => undefined | (() => void)
): LocalStoreClass<SimpleStore<V>>
