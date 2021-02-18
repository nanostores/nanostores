import { MapStore } from '../create-map/index.js'

type Data = { [key: string]: string | undefined }

/**
 * Keep key-value data in localStorage.
 *
 * ```js
 * import { createPersistent } from '@logux/state'
 *
 * export const settings = createPersistent<{
 *   theme: 'dark' | 'light'
 *   favorite: string
 * }>({ theme: 'light' }, 'settings:')
 * ```
 *
 * @param prefix Optional key prefix in localStorage.
 */
export function createPersistent<V extends Data> (
  initial?: V,
  prefix?: string
): MapStore<V>
