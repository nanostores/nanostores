import { WritableStore } from '../map/index.js'

/**
 * Action is a function which change the store.
 *
 * This wrap allows DevTools to see the name of action, which changes the store.
 *
 * ```js
 * export const setName = action(store, 'setName', name => {
 *   if (validateName(name)) {
 *     store.set(name)
 *   }
 * })
 * setName('John')
 * ```
 *
 * @param store Store instance.
 * @param actionName Action name for logs.
 * @param cb Function changing the store.
 * @returns Wrapped function with the same arguments.
 */
export function action<Callback extends (...args: any[]) => any>(
  store: WritableStore,
  actionName: string,
  cb: Callback
): Callback
