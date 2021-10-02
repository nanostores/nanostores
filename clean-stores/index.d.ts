import { MapBuilder, AnySyncBuilder } from '../map-template/index.js'
import { Store } from '../map/index.js'

export const clean: unique symbol

/**
 * Destroys all cached stores and call
 *
 * It also reset all effects by calling {@link cleanEffects}.
 *
 * ```js
 * import { cleanStores } from 'nanostores'
 *
 * afterEach(() => {
 *   cleanStores(Router, Settings, User)
 * })
 * ```
 *
 * @param stores Used store classes.
 * @return Promise for stores destroying.
 */
export function cleanStores(
  ...stores: (Store | MapBuilder | AnySyncBuilder | undefined)[]
): void
