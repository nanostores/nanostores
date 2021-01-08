import { LocalStoreConstructor, LocalStoreClass } from '../local-store/index.js'
import { SimpleStore } from '../local/index.js'
import { AnyClass } from '../store/index.js'

type Instances<A extends [AnyClass, ...AnyClass[]]> = {
  [K in keyof A]: A[K] extends AnyClass ? InstanceType<A[K]> : never
}

interface Derived {
  <V, S extends [LocalStoreConstructor, ...LocalStoreConstructor[]]>(
    storeClasses: S,
    cb: (...stores: Instances<S>) => V
  ): LocalStoreClass<SimpleStore<V>>
  <V, S extends LocalStoreConstructor>(
    storeClass: S,
    cb: (store: InstanceType<S>) => V
  ): LocalStoreClass<SimpleStore<V>>
}

/**
 * Shortcut to create local store with single value and without methods.
 *
 * ```js
 * import { derived } from '@logux/state'
 *
 * import { CurrentTime } from '~/store'
 *
 * let start = new Date()
 * export const OpenSince = derived([CurrentTime], now => now.value - start)
 * ```
 *
 * @param storeClasses Input stores.
 * @param cb Callback on stores changes.
 * @returns Store class.
 */
export const derived: Derived
