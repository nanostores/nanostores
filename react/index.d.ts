import { Context, Component, ComponentType } from 'react'
import {
  Client,
  ChannelNotFoundError,
  ChannelDeniedError,
  ChannelServerError
} from '@logux/client'

import { LocalStoreClass, RemoteStoreClass } from '../store/index.js'

/**
 * Context to send Logux Client or object space to components deep in the tree.
 *
 * ```js
 * import { ClientContext, ChannelErrors } from '@logux/state/react'
 * import { CrossTabClient } from '@logux/client'
 *
 * let client = new CrossTabClient(…)
 *
 * render(
 *  <ClientContext.Provider value={client}>
 *    <ChannelErrors NotFound={Page404} AccessDenied={Page403}>
 *      <Counter />
 *    </ChannelErrors>
 *  </ClientContext.Provider>,
 *  document.body
 * )
 * ```
 */
export const ClientContext: Context<Client>

/**
 * Create local store instance and subscribe to store changes.
 *
 * When component will be unmount, store will be removed as well if it was
 * the last store’s listener.
 *
 * ```js
 * import { useLocalStore } from '@logux/state/react'
 * import { Router } from '@logux/state'
 *
 * export const Layout: FC = () => {
 *   let router = useLocalStore(Router)
 *   if (router.page === 'home') {
 *     return <HomePage />
 *   } else {
 *     return <Error404 />
 *   }
 * }
 * ```
 *
 * @param StoreClass Local store class.
 * @returns Store instance.
 */
export function useLocalStore<T extends LocalStoreClass> (
  StoreClass: T
): InstanceType<T>

/**
 * Load remote store from the source and subscribe to store changes.
 *
 * When component will be unmount, store will be removed as well if it was
 * the last store listener.
 *
 * You must wrap all components with `useRemoteStore()` into `<ChannelErrors>`.
 *
 * ```js
 * import { useRemoteStore } from '@logux/state/react'
 *
 * import { User } from '../stores'
 *
 * export const Users: FC = ({ id }) => {
 *   let [isLoading, user] = useRemoteStore(User, id)
 *   if (isLoading) {
 *     return <Loader />
 *   } else {
 *     return <UserPage user={user} />
 *   }
 * }
 * ```
 *
 * @param StoreClass Remote store class.
 * @param id Store ID.
 * @returns Array with loading marker and store instance.
 */
export function useRemoteStore<T extends RemoteStoreClass> (
  StoreClass: T,
  id: string
): [boolean, InstanceType<T>]

/**
 * Show error message to user on subscription errors in components
 * deep in the tree.
 *
 * ```js
 * import { ChannelErrors } from '@logux/state/react'
 *
 * export const App: FC = () => {
 *   return <>
 *     <SideMenu />
 *     <ChannelErrors
 *       NotFound={NotFoundPage}
 *       AccessDenied={AccessDeniedPage}
 *       ServerError={ServerErrorPage}
 *     >
 *       <Layout />
 *     </ChannelErrors>
 *   <>
 * }
 * ```
 */
export class ChannelErrors extends Component<{
  NotFound?: ComponentType<{ error: ChannelNotFoundError }>
  AccessDenied?: ComponentType<{ error: ChannelDeniedError }>
  ServerError?: ComponentType<{ error: ChannelServerError }>
}> {}
