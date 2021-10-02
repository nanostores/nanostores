import type { Store } from '../map/index.js'

export const STORE_UNMOUNT_DELAY: number

/**
 * Run constructor on first store’s listener and run destructor on last listener
 * unsubscription.
 *
 * A way to reduce memory and CPU usage when you do not need a store.
 *
 * ```js
 * import { mount } from 'nanostores'
 *
 * // Listen for URL changes on first store’s listener.
 * mount(router, {
 *   parse()
 *   window.addEventListener('popstate', parse)
 *   return () => {
 *     window.removeEventListener('popstate', parse)
 *   }
 * })
 * ```
 *
 * @param store Store to listen.
 * @param initialize Store constructor.
 * @return A function to remove constructor and destructor from store.
 */
export function mount(store: Store, initialize: () => void): () => void
