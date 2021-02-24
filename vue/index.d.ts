import {
  App,
  Component,
  ComponentPublicInstance,
  DeepReadonly,
  InjectionKey,
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
import { MapStoreBuilder } from '../define-map/index.js'

export const ClientKey: InjectionKey<Client>
export const ErrorsKey: InjectionKey<Client>

export function loguxClient (app: App, client: Client): void

export function useClient (): Client

/**
 * @param store Store instance.
 * @returns Store value.
 */
export function useStore<V> (store: Store<V>): DeepReadonly<Ref<V>>

/**
 * @param Builder Store builder.
 * @param id Store ID.
 * @returns Store value.
 */
export function useStore<V extends SyncMapValues> (
  Builder: SyncMapBuilder<V>,
  id: Ref<string> | string
): DeepReadonly<Ref<SyncMapValue<V>>>

/**
 * @param Builder Store builder.
 * @param id Store ID.
 * @param args Other store arguments.
 * @returns Store value.
 */
export function useStore<V extends object, A extends any[]> (
  Builder: MapStoreBuilder<V, [Client, ...A]>,
  id: Ref<string> | string,
  ...args: A
): DeepReadonly<Ref<V>>
export function useStore<V extends object> (
  Builder: MapStoreBuilder<V, []>,
  id: string
): DeepReadonly<Ref<V>>

export const ChannelErrors: Component

export type ChannelErrorsSlotProps = {
  error: DeepReadonly<
    Ref<{
      data: ChannelError
      instance: ComponentPublicInstance
      info: string
    } | null>
  >
  code: Ref<number | null>
}

export function useFilter<V extends SyncMapValues> (
  Builder: SyncMapBuilder<V>,
  filter?: Filter<V>,
  opts?: FilterOptions<V>
): DeepReadonly<Ref<StoreValue<FilterStore<V>>>>
