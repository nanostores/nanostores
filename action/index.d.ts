import type { WritableStore } from '../map/index.js'

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R
  ? (...args: P) => R
  : never

export const lastAction: unique symbol
export const actionId: unique symbol

/**
 * Action is a function which changes the store.
 *
 * This wrap allows DevTools to see the name of action, which changes the store.
 *
 * ```js
 * export const increase = action($counter, 'increase', ($store, value = 1) => {
 *   if (validateMax($store.get() + value)) {
 *     $store.set($store.get() + value)
 *   }
 *   return $store.get()
 * })
 *
 * increase()  //=> 1
 * increase(5) //=> 6
 * ```
 *
 * @param store Store instance.
 * @param actionName Action name for logs.
 * @param cb Function changing the store.
 * @returns Wrapped function with the same arguments.
 */
export function action<
  SomeStore extends WritableStore,
  Callback extends ($store: SomeStore, ...args: any[]) => any
>(store: SomeStore, actionName: string, cb: Callback): OmitFirstArg<Callback>
