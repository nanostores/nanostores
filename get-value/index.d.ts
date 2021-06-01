import { StoreLike, StoreValue } from '../create-store/index.js'

/**
 * Shortcut to subscribe for store, get value and unsubscribe immediately.
 *
 * ```js
 * import { getValue } from '@logux/state'
 *
 * import { router } from '../store'
 *
 * console.log(getValue(router))
 * ```
 *
 * @param store The store.
 * @returns Store value.
 */
export function getValue<Value extends any, TStore extends StoreLike<Value>>(
  store: TStore
): Readonly<StoreValue<TStore>>
