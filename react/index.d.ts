import { MapStore, Store, StoreValue } from '../atom/index.js'

export interface UseStoreOptions<SomeStore, Key extends string> {
  keys?: SomeStore extends MapStore ? Key[] : never
}

/**
 * Subscribe to store changes and get store’s value.
 *
 * Can be user with store builder too.
 *
 * ```js
 * import { useStore } from 'nanostores/react'
 *
 * import { router } from '../store/router'
 *
 * export const Layout = () => {
 *   let page = useStore(router)
 *   if (page.router === 'home') {
 *     return <HomePage />
 *   } else {
 *     return <Error404 />
 *   }
 * }
 * ```
 *
 * @param store Store instance.
 * @returns Store value.
 */
export function useStore<
  SomeStore extends Store,
  Value extends StoreValue<Store>,
  Key extends keyof Value
>(
  store: SomeStore,
  options?: UseStoreOptions<SomeStore, Key>
): SomeStore extends MapStore ? Pick<Value, Key> : Value

/**
 * Batch React updates. It is just wrap for React’s `unstable_batchedUpdates`
 * with fix for React Native.
 *
 * ```js
 * import { batch } from 'nanostores/react'
 *
 * React.useEffect(() => {
 *   let unbind = store.listen(() => {
 *     batch(() => {
 *       forceRender({})
 *     })
 *   })
 * })
 * ```
 *
 * @param cb Callback to run in batching.
 */
export function batch(cb: () => void): void
