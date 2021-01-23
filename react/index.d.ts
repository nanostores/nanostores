import { Context, Component, ComponentType, ReactNode } from 'react'
import {
  Client,
  ChannelNotFoundError,
  ChannelDeniedError,
  ChannelError
} from '@logux/client'

import { FilterStore, Filter, FilterOptions } from '../filter-store/index.js'
import { LoguxClientStoreConstructor } from '../logux-client-store/index.js'
import { RemoteStoreConstructor } from '../remote-store/index.js'
import { LocalStoreConstructor } from '../local-store/index.js'
import { SyncMap } from '../sync-map/index.js'

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
 *      <App />
 *    </ChannelErrors>
 *  </ClientContext.Provider>,
 *  document.body
 * )
 * ```
 */
export const ClientContext: Context<Client>

/**
 * Hook to return Logux client, which you set by `<ClientContext.Provider>`.
 *
 * ```js
 * let client = useClient()
 * let onAdd = data => {
 *   Post.create(client, data)
 * }
 * ```
 */
export function useClient (): Client

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
export function useLocalStore<T extends LocalStoreConstructor> (
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
export function useRemoteStore<
  T extends RemoteStoreConstructor | LoguxClientStoreConstructor,
  I extends string
> (
  StoreClass: T,
  id: I
): { isLoading: true; id: I } | (InstanceType<T> & { isLoading: false })

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
 *       Error={ServerErrorPage}
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
  Error?: ComponentType<{ error: ChannelError }>
}> {}

/**
 * The way to `FilterStore` in React.
 *
 * This method will subscribe only to list changes and will NOT subscribe
 * to children changes. Use `map()`
 *
 * ```js
 * import { useFilter, map } from '@logux/state/react'
 *
 * import { User } from '../store'
 *
 * export const Users = ({ projectId }) => {
 *   let users = useFilter(User, { projectId })
 *   return <div>
 *     {users.isLoading && <Loader />}
 *     {map(users, user => <User user={user} />)}
 *   </div>
 * }
 * ```
 *
 * @param StoreClass Store class.
 * @param filter Key-value filter for stores.
 */
export function useFilter<M extends SyncMap> (
  StoreClass: LoguxClientStoreConstructor<M>,
  filter?: Filter<M>,
  opts?: FilterOptions<M>
): FilterStore<M>

/**
 * Render each element and subscribe to item changes.
 *
 * If filter store item will be changes, only one element will be re-rendered.
 *
 * @param filterStore
 * @param render
 */
export function map<S extends SyncMap> (
  filterStore: FilterStore<S>,
  render: (item: S, index: number) => ReactNode
): ReactNode
