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

/**
 * Create store instance and subscribe to it changes.
 *
 * When component will be unmount, store will be removed as well if it was
 * the last store listener.
 *
 * ```js
 * import { useStore } from '@logux/state/react'
 * import { Router } from '@logux/state'
 *
 * export const Layout: FC = () => {
 *   let router = useStore(Router)
 *   if (router.page === 'home') {
 *     return <HomePage />
 *   } else {
 *     return <Error404 />
 *   }
 * }
 * ```
 *
 * ```js
 * import { useStore } from '@logux/state/react'
 *
 * import { Tooltip } from '../stores'
 *
 * export const TooltipItem: FC = ({ id }) => {
 *   let tooltip = useStore(Tooltip, id)
 *   return <FloatingBlock>{ tooltip.text }</FloatingBlock>
 * }
 * ```
 */
export const useStore: UseStore
