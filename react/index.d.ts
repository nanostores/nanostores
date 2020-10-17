import { Context } from 'react'
import { Client } from '@logux/client'

import { StoreClass } from '../store/index.js'
import { ModelClass } from '../model/index.js'

/**
 * Context to send Logux Client or object space to components deep in the tree.
 *
 * ```js
 * import { ObjectSpaceContext } from '@logux/state/react'
 * import { CrossTabClient } from '@logux/client'
 *
 * let client = new CrossTabClient(…)
 *
 * render(
 *  <ClientContext.Provider value={client}>
 *    <Counter />
 *  </ClientContext.Provider>,
 *  document.body
 * )
 * ```
 */
export const ClientContext: Context<Client>

interface UseStore {
  <T extends ModelClass>(Model: T, id: string): InstanceType<T>
  <T extends StoreClass>(Store: T): InstanceType<T>
}

export const useStore: UseStore
