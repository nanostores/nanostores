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
  ActionName extends string,
  Callback
>(store: Store, actionName: ActionName, cb: Callback): Callback

export function action<
  Store extends MapStore,
  ActionName extends string,
  Callback
>(store: Store, actionName: ActionName, cb: Callback): Callback
