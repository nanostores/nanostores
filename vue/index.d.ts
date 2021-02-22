import {
  App,
  Component,
  ComponentPublicInstance,
  DeepReadonly,
  InjectionKey,
  Ref
} from 'vue'
import { Client, LoguxUndoError } from '@logux/client'

import { SyncMapBuilder, SyncMapValues } from '../define-sync-map/index.js'
import { MapStoreBuilder } from '../define-map/index.js'
import { Store } from '../create-store/index.js'

export const ClientKey: InjectionKey<Client>
export const ErrorsKey: InjectionKey<Client>

export function install (app: App, client: Client): void

export function useClient (): Client

type StoreId = string | Ref<string>

/**
 * @param store Store instance.
 * @returns Store value.
 */
export function useStore<V> (
  store: Store<V>
): V extends object ? DeepReadonly<V> : DeepReadonly<Ref<V>>

/**
 * @param Builder Store builder.
 * @param id Store ID.
 * @returns Store value.
 */
export function useStore<V extends SyncMapValues> (
  Builder: SyncMapBuilder<V>,
  id: StoreId
): DeepReadonly<Ref<V>>

/**
 * @param Builder Store builder.
 * @param id Store ID.
 * @param args Other store arguments.
 * @returns Store value.
 */
export function useStore<V extends object, A extends any[]> (
  Builder: MapStoreBuilder<V, A>,
  id: StoreId,
  ...args: A
): DeepReadonly<Ref<V & { id: string }>>

export const ChannelErrors: Component

export type ChannelErrorsSlotProps = {
  error: DeepReadonly<
    Ref<{
      data: LoguxUndoError
      instance: ComponentPublicInstance
      info: string
    } | null>
  >
  code: Ref<number>
}
