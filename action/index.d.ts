import { WritableAtom, MapStore } from '../index.js'

/**
 * It's wraping your function and mark it as action for plugins.
 * ```js
 * const setName = action(store, 'setName', name => store.set(name))
 * setName('John')
 * ```
 * @param store Store instance.
 * @param actionName Loging name.
 * @param cb Your own function.
 * @returns Your own function.
 */
export function action<
  Store extends WritableAtom,
  Callback extends (...args: any[]) => any
>(store: Store, actionName: string, cb: Callback): Callback

export function action<
  Store extends MapStore,
  Callback extends (...args: any[]) => any
>(store: Store, actionName: string, cb: Callback): Callback
