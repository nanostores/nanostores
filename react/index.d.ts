import { Context } from 'react'
import { Client } from '@logux/client'

import { LoadingModelClass, ModelClass } from '../model/index.js'
import { StoreClass } from '../store/index.js'

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
  <T extends LoadingModelClass>(ModelCls: T, id: string): [
    boolean,
    InstanceType<T>
  ]
  <T extends ModelClass>(ModelCls: T, id: string): InstanceType<T>
  <T extends StoreClass>(StoreCls: T): InstanceType<T>
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
 * import { User } from '../stores'
 *
 * export const Users: FC = ({ id }) => {
 *   let [isLoading, user] = useStore(User, id)
 *   if (isLoading) {
 *     return <Loader />
 *   } else {
 *     return <UserPage user={user} />
 *   }
 * }
 * ```
 */
export const useStore: UseStore
