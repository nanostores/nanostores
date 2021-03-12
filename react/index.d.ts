import { FC, Context, Component, ComponentType } from 'react'
import {
  ChannelNotFoundError,
  ChannelDeniedError,
  ChannelError,
  Client
} from '@logux/client'

import {
  SyncMapBuilder,
  SyncMapValues,
  SyncMapValue
} from '../define-sync-map/index.js'
import { FilterStore, Filter, FilterOptions } from '../create-filter/index.js'
import { Store, StoreValue } from '../create-store/index.js'
import { MapBuilder } from '../define-map/index.js'

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
export function useClient(): Client

/**
 * Subscribe to store changes and get store’s value.
 *
 * Can be user with store builder too.
 *
 * ```js
 * import { useStore } from '@logux/state/react'
 * import { router } from '@logux/state'
 *
 * export const Layout: FC = () => {
 *   let page = useStore(router)
 *   if (page.router === 'home') {
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
 * import { User } from '../store'
 *
 * export const UserPage: FC = ({ id }) => {
 *   let user = useStore(User, id)
 *   if (user.isLoading) {
 *     return <Loader />
 *   } else {
 *     return <h1>{user.name}</h1>
 *   }
 * }
 * ```
 *
 * @param store Store instance.
 * @returns Store value.
 */
export function useStore<V>(store: Store<V>): V
/**
 * @param Builder Store builder.
 * @param id Store ID.
 * @returns Store value.
 */
export function useStore<V extends SyncMapValues>(
  Builder: SyncMapBuilder<V>,
  id: string
): SyncMapValue<V>
/**
 * @param Builder Store builder.
 * @param id Store ID.
 * @param args Other store arguments.
 * @returns Store value.
 */
export function useStore<V extends object, A extends any[]>(
  Builder: MapBuilder<V, [Client, ...A]>,
  id: string,
  ...args: A
): V
export function useStore<V extends object>(
  Builder: MapBuilder<V, []>,
  id: string
): V

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
 * The way to {@link createFiler} in React.
 *
 * ```js
 * import { useFilter, map } from '@logux/state/react'
 *
 * import { User } from '../store'
 *
 * export const Users = ({ projectId }) => {
 *   let users = useFilter(User, { projectId })
 *   return <div>
 *     {users.list.map(user => <User user={user} />)}
 *     {users.isLoading && <Loader />}
 *   </div>
 * }
 * ```
 *
 * @param Builder Store class.
 * @param filter Key-value filter for stores.
 * @param opts Filter options.
 * @returns Filter store to use with map.
 */
export function useFilter<V extends SyncMapValues>(
  Builder: SyncMapBuilder<V>,
  filter?: Filter<V>,
  opts?: FilterOptions<V>
): StoreValue<FilterStore<V>>

type Mock = [SyncMapBuilder, object] | [MapBuilder, object]

export const TestScene: FC<{
  clean?: boolean
  client: Client
  mocks: Mock[]
}>
