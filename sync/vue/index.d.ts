import {
  ComponentPublicInstance,
  DeepReadonly,
  InjectionKey,
  UnwrapRef,
  Component,
  App,
  Ref
} from 'vue'
import { Client, ChannelError } from '@logux/client'
import { SyncMapValues } from '@logux/actions'

import { FilterOptions, FilterStore, Filter } from '../create-filter/index.js'
import { SyncMapBuilder, SyncMapValue } from '../define-sync-map/index.js'
import { StoreValue } from '../../create-store/index.js'
import { MapBuilder } from '../../define-map/index.js'

export type Refable<Type> = Ref<Type> | Type
export type ReadonlyRef<Type> = DeepReadonly<{ value: UnwrapRef<Type> }>

export const ClientKey: InjectionKey<Client>
export const ErrorsKey: InjectionKey<ChannelErrorsSlotProps>

/**
 * Plugin that injects Logux Client into all components within the application.
 *
 * ```js
 * import { createApp } from 'vue'
 * import { loguxClient } from '@logux/state/sync/vue'
 * import { CrossTabClient } from '@logux/client'
 *
 * let client = new CrossTabClient(…)
 * let app = createApp(…)
 *
 * app.use(loguxClient, client)
 * ```
 */
export function loguxClient(app: App, client: Client): void

/**
 * Returns the Logux Client that was installed through `loguxClient` plugin.
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
 * Create store by ID, subscribe to store changes and get store’s value.
 *
 * ```js
 * import { useSync } from '@logux/state/sync/vue'
 *
 * import { User } from '../store'
 *
 * export default {
 *   props: ['id'],
 *   setup (props) {
 *     let { id } = toRefs(props)
 *     let user = useSync(User, id)
 *     return { user }
 *   },
 *   template: `
 *     <loading v-if="user.isLoading" />
 *     <h1 v-else>{{ user.name }}</h1>
 *   `
 * }
 * ```
 *
 * @param Builder Store builder.
 * @param id Store ID.
 * @param args Other store arguments.
 * @returns Store value.
 */
export function useSync<Value extends SyncMapValues>(
  Builder: SyncMapBuilder<Value>,
  id: Refable<string>
): ReadonlyRef<SyncMapValue<Value>>
export function useSync<Value extends object, Args extends any[]>(
  Builder: MapBuilder<Value, [Client, ...Args]>,
  id: Refable<string>,
  ...args: Args
): ReadonlyRef<Value>

/**
 * The way to {@link createFilter} in Vue.
 *
 * ```js
 * import { useFilter } from '@logux/state/sync/vue'
 *
 * import { User } from '../store'
 *
 * export default {
 *   props: ['projectId'],
 *   setup (props) {
 *     let users = useFilter(User, { projectId: props.projectId })
 *     return { users }
 *   },
 *   template: `
 *     <div>
 *       <user v-for="user in users" :user="user" />
 *       <loader v-if="users.isLoading" />
 *     </div>
 *   `
 * }
 * ```
 *
 * @param Builder Store class.
 * @param filter Key-value filter for stores.
 * @param opts Filter options.
 * @returns Filter store to use with map.
 */
export function useFilter<Value extends SyncMapValues>(
  Builder: SyncMapBuilder<Value>,
  filter?: Refable<Filter<Value>>,
  opts?: Refable<FilterOptions>
): ReadonlyRef<StoreValue<FilterStore<Value>>>

/**
 * Show error message to user on subscription errors in components
 * deep in the tree.
 *
 * ```js
 * import { ChannelErrors } from '@logux/state/sync/vue'
 *
 * export default {
 *   components: { ChannelErrors },
 *   template: `
 *     <channel-errors v-slot="{ code, error }">
 *       <layout v-if="!error" />
 *       <error v-else-if="code === 500" />
 *       <error-not-found v-else-if="code === 404" />
 *       <error-access-denied v-else-if="code === 403" />
 *     </channel-errors>
 *   `
 * }
 * ```
 */
export const ChannelErrors: Component

export interface ChannelErrorsSlotProps {
  error: DeepReadonly<
    Ref<{
      data: ChannelError
      instance: ComponentPublicInstance
      info: string
    } | null>
  >
  code: DeepReadonly<Ref<number | null>>
}
