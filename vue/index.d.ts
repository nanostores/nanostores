import {
  ComponentPublicInstance,
  DeepReadonly,
  InjectionKey,
  Component,
  App,
  Ref
} from 'vue'
import { Client, ChannelError } from '@logux/client'

import {
  SyncMapBuilder,
  SyncMapValues,
  SyncMapValue
} from '../define-sync-map/index.js'
import { FilterStore, Filter, FilterOptions } from '../create-filter/index.js'
import { Store, StoreValue } from '../create-store/index.js'
import { MapBuilder } from '../define-map/index.js'

export type Refable<Type> = Ref<Type> | Type

export const ClientKey: InjectionKey<Client>
export const ErrorsKey: InjectionKey<Client>

/**
 * Plugin that injects Logux Client into all components within the application.
 *
 * ```js
 * import { createApp } from 'vue'
 * import { loguxClient } from '@logux/state/vue'
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
 * Subscribes to store changes and gets store’s value.
 *
 * Can be used with store builder too.
 *
 * ```js
 * import { useStore } from '@logux/state/vue'
 * import { router } from '@logux/state'
 *
 * export default {
 *   setup () {
 *     let page = useStore(router)
 *     return { page }
 *   },
 *   template: `
 *     <home-page v-if="page.router === 'home'" />
 *     <error-not-found v-else />
 *   `
 * }
 * ```
 *
 * ```js
 * import { useStore } from '@logux/state/vue'
 *
 * import { User } from '../store'
 *
 * export default {
 *   props: ['id'],
 *   setup (props) {
 *     let { id } = toRefs(props)
 *     let user = useStore(User, id)
 *     return { user }
 *   },
 *   template: `
 *     <loading v-if="user.isLoading" />
 *     <h1 v-else>{{ user.name }}</h1>
 *   `
 * }
 * ```
 *
 * @param store Store instance.
 * @returns Store value.
 */
export function useStore<Value>(store: Store<Value>): DeepReadonly<Ref<Value>>

/**
 * @param Builder Store builder.
 * @param id Store ID.
 * @returns Store value.
 */
export function useStore<Value extends SyncMapValues>(
  Builder: SyncMapBuilder<Value>,
  id: Refable<string>
): DeepReadonly<Ref<SyncMapValue<Value>>>

/**
 * @param Builder Store builder.
 * @param id Store ID.
 * @param args Other store arguments.
 * @returns Store value.
 */
export function useStore<Value extends object, Args extends any[]>(
  Builder: MapBuilder<Value, [Client, ...Args]>,
  id: Refable<string>,
  ...args: Args
): DeepReadonly<Ref<Value>>
export function useStore<Value extends object>(
  Builder: MapBuilder<Value, []>,
  id: Refable<string>
): DeepReadonly<Ref<Value>>

/**
 * Show error message to user on subscription errors in components
 * deep in the tree.
 *
 * ```js
 * import { ChannelErrors } from '@logux/state/vue'
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
  code: Ref<number | null>
}

/**
 * The way to {@link createFilter} in Vue.
 *
 * ```js
 * import { useFilter } from '@logux/state/vue'
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
): DeepReadonly<Ref<StoreValue<FilterStore<Value>>>>
