import { Store } from '../create-store/index.js'

/**
 * Subscribe to store changes and get store’s value.
 *
 * Can be user with store builder too.
 *
 * ```js
 * import { useStore } from '@logux/state/preact'
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
 * import { useStore } from '@logux/state/preact'
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
export function useStore<Value extends any>(store: Store<Value>): Value
