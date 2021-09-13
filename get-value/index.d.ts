import { ReadableStore } from '../create-atom/index.js'

type ReaonlyIfCan<Value> = Value extends (...args: any) => any
  ? Value
  : Readonly<Value>

/**
 * Shortcut to subscribe for store, get value and unsubscribe immediately.
 *
 * ```js
 * import { getValue } from 'nanostores'
 *
 * import { router } from '../store'
 *
 * console.log(getValue(router))
 * ```
 *
 * @param store The store.
 * @returns Store value.
 */
export function getValue<Value extends any>(
  store: ReadableStore<Value>
): ReaonlyIfCan<Value>
