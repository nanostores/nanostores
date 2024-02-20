import type { WritableAtom } from '../atom/index.js'
import type { AllPaths, BaseDeepMap, FromPath } from './path.js'

export { AllPaths, BaseDeepMap, FromPath, getPath, setPath } from './path.js'

export type DeepMapStore<T extends BaseDeepMap> = Omit<
  WritableAtom<T>,
  'listen' | 'setKey' | 'subscribe'
> & {
  /**
   * Subscribe to store changes.
   *
   * In contrast with {@link Store#subscribe} it do not call listener
   * immediately.
   *
   * @param listener Callback with store value and old value.
   * @param changedKey Key that was changed. Will present only if `setKey`
   *                   has been used to change a store.
   * @returns Function to remove listener.
   */
  listen(
    listener: (
      value: T,
      oldValue: T,
      changedKey: AllPaths<T> | undefined
    ) => void
  ): () => void

  /**
   * Change key in store value.
   *
   * ```js
   * $settings.setKey('visuals.theme', 'dark')
   * ```
   *
   * @param key The key name. Attributes can be split with a dot `.` and `[]`.
   * @param value New value.
   */
  setKey: <K extends AllPaths<T>>(key: K, value: FromPath<T, K>) => void

  /**
   * Subscribe to store changes and call listener immediately.
   *
   * ```
   * import { $settings } from '../store'
   *
   * $settings.subscribe(settings => {
   *   console.log(settings)
   * })
   * ```
   *
   * @param listener Callback with store value and old value.
   * @param changedKey Key that was changed. Will present only
   *                   if `setKey` has been used to change a store.
   * @returns Function to remove listener.
   */
  subscribe(
    listener: (
      value: T,
      oldValue: T | undefined,
      changedKey: AllPaths<T> | undefined
    ) => void
  ): () => void
}

/**
 * Create deep map store. Deep map store is a store with an object as store
 * value, that supports fine-grained reactivity for deeply nested properties.
 *
 * @param init Initialize store and return store destructor.
 * @returns The store object with methods to subscribe.
 */
export function deepMap<T extends BaseDeepMap>(init?: T): DeepMapStore<T>
