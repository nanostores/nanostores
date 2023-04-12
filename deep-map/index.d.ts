import { AllPaths, FromPath, BaseDeepMap } from './path.js'
import { WritableAtom } from '../atom/index.js'

export { AllPaths, FromPath, BaseDeepMap, getPath, setPath } from './path.js'

type Listener<T extends BaseDeepMap> = (
  listener: (value: T, changedKey: undefined | AllPaths<T>) => void
) => () => void

export type DeepMapStore<T extends BaseDeepMap> = Omit<
  WritableAtom<T>,
  'setKey' | 'listen' | 'subscribe'
> & {
  /**
   * Change key in store value.
   *
   * ```js
   * settings.setKey('visuals.theme', 'dark')
   * ```
   *
   * @param key The key name. Attributes can be split with a dot `.` and `[]`.
   * @param value New value.
   */
  setKey: <K extends AllPaths<T>>(key: K, value: FromPath<T, K>) => void

  /**
   * Subscribe to store changes.
   *
   * In contrast with {@link Store#subscribe} it do not call listener
   * immediately.
   *
   * @param listener Callback with store value.
   * @param changedKey Key that was changed. Will present only if `setKey`
   *                   has been used to change a store.
   * @returns Function to remove listener.
   */
  listen: Listener<T>

  /**
   * Subscribe to store changes and call listener immediately.
   *
   * ```
   * import { router } from '../store'
   *
   * router.subscribe(page => {
   *   console.log(page)
   * })
   * ```
   *
   * @param listener Callback with store value.
   * @param changedKey Key that was changed. Will present only
   *                   if `setKey` has been used to change a store.
   * @returns Function to remove listener.
   */
  subscribe: Listener<T>
}

/**
 * Create deep map store. Deep map store is a store with an object as store
 * value, that supports fine-grained reactivity for deeply nested properties.
 *
 *
 * @param init Initialize store and return store destructor.
 * @returns The store object with methods to subscribe.
 */
export function deepMap<T extends BaseDeepMap>(init?: T): DeepMapStore<T>
