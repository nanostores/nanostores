import { MapTemplate, AnySyncTemplate } from '../deprecated/index.js'
import { Store } from '../map/index.js'

export const clean: unique symbol

/**
 * Destroys all cached stores and call
 *
 * It also reset all tasks by calling {@link cleanTasks}.
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
  ...stores: (Store | MapTemplate | AnySyncTemplate | undefined)[]
): void
