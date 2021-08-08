import { ReadableStore } from '../create-store/index.js'

export interface UseStoreOptions {
  keys?: string[]
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
export function useStore<Value extends any>(
  store: ReadableStore<Value>,
  options?: UseStoreOptions
): Value

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
