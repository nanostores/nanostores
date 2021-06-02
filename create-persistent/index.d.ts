import { MapStore } from '../create-map/index.js'

/**
 * Keep key-value data in localStorage.
 *
 * ```js
 * import { createPersistent } from 'nanostores'
 *
 * export const settings = createPersistent<{
 *   theme: 'dark' | 'light'
 *   favorite: string
 * }>({ theme: 'light' }, 'settings:')
 * ```
 *
 * @param prefix Optional key prefix in localStorage.
 */
export function createPersistent<
  Value extends Record<string, string | undefined>
>(initial?: Value, prefix?: string): MapStore<Value>
