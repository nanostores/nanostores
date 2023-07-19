import type { MapStore, Store, StoreValue } from '../map/index.js'

type AtomSetPayload<Shared, SomeStore extends Store> = {
  abort(): void
  changed: undefined
  newValue: StoreValue<SomeStore>
  shared: Shared
}

type MapSetPayload<Shared, SomeStore extends Store> =
  | {
      abort(): void
      changed: keyof StoreValue<SomeStore>
      newValue: StoreValue<SomeStore>
      shared: Shared
    }
  | AtomSetPayload<Shared, SomeStore>

type AtomNotifyPayload<Shared> = {
  abort(): void
  changed: undefined
  shared: Shared
}

type MapNotifyPayload<Shared, SomeStore extends Store> =
  | {
      abort(): void
      changed: keyof StoreValue<SomeStore>
      shared: Shared
    }
  | AtomNotifyPayload<Shared>

/**
 * Add listener to store chagings.
 *
 * ```js
 * import { onSet } from 'nanostores'
 *
 * onSet($store, ({ newValue, abort }) => {
 *   if (!validate(newValue)) {
 *     abort()
 *   }
 * })
 * ```
 *
 * You can communicate between listeners by `payload.shared`
 * or cancel changes by `payload.abort()`.
 *
 * New value of the all store will be `payload.newValue`.
 * On `MapStore#setKey()` call, changed value will be in `payload.changed`.
 *
 * @param $store The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onSet<Shared = never, SomeStore extends Store = Store>(
  $store: SomeStore,
  listener: (
    payload: SomeStore extends MapStore
      ? MapSetPayload<Shared, SomeStore>
      : AtomSetPayload<Shared, SomeStore>
  ) => void
): () => void

/**
 * Add listener to notifing about store changes.
 *
 * You can communicate between listeners by `payload.shared`
 * or cancel changes by `payload.abort()`.
 *
 * On `MapStore#setKey()` call, changed value will be in `payload.changed`.
 *
 * @param $store The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onNotify<Shared = never, SomeStore extends Store = Store>(
  $store: SomeStore,
  listener: (
    payload: SomeStore extends MapStore
      ? MapNotifyPayload<Shared, SomeStore>
      : AtomNotifyPayload<Shared>
  ) => void
): () => void

/**
 * Add listener on first store listener.
 *
 * We recommend to always use `onMount` instead to prevent flickering.
 * See {@link onMount} to add constructor and destructor for the store.
 *
 * You can communicate between listeners by `payload.shared`.
 *
 * @param $store The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onStart<Shared = never>(
  $store: Store,
  listener: (payload: { shared: Shared }) => void
): () => void

/**
 * Add listener on last store listener unsubscription.
 *
 * We recommend to always use `onMount` instead to prevent flickering.
 * See {@link onMount} to add constructor and destructor for the store.
 *
 * You can communicate between listeners by `payload.shared`.
 *
 * @param $store The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onStop<Shared = never>(
  $store: Store,
  listener: (payload: { shared: Shared }) => void
): () => void

export const STORE_UNMOUNT_DELAY: number

/**
 * Run constructor on first store’s listener and run destructor on last listener
 * unsubscription. It has a debounce to prevent flickering.
 *
 * A way to reduce memory and CPU usage when you do not need a store.
 *
 * You can communicate between listeners by `payload.shared`.
 *
 * ```js
 * import { onMount } from 'nanostores'
 *
 * // Listen for URL changes on first store’s listener.
 * onMount($router, () => {
 *   parse()
 *   window.addEventListener('popstate', parse)
 *   return () => {
 *     window.removeEventListener('popstate', parse)
 *   }
 * })
 * ```
 *
 * @param $store Store to listen.
 * @param initialize Store constructor. Returns store destructor.
 * @return A function to remove constructor and destructor from store.
 */
export function onMount<Shared = never>(
  $store: Store,
  initialize: (payload: { shared: Shared }) => (() => void) | void
): () => void

interface OnActionEvent<Shared, Payload = {}> {
  (listener: (payload: { shared: Shared } & Payload) => void): void
}

/**
 * Adds listener for the start, end, and errors of actions.
 *
 * It handles errors only from asynchronous actions.
 *
 * ```js
 * import { onAction } from 'nanostores'
 *
 * onAction($store, ({ actionName, onEnd, onError }) => {
 *   console.log('action started', actionName)
 *   onError(({ error }) => {
 *     console.error('action error', actionName, error)
 *   })
 *   onEnd(() => {
 *     console.log('action ended', actionName)
 *   })
 * })
 * ```
 *
 * @param $store The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onAction<Shared = never>(
  $store: Store,
  listener: (payload: {
    actionName: string
    args: any[]
    id: number
    onEnd: OnActionEvent<Shared>
    onError: OnActionEvent<Shared, { error: Error }>
    shared: Shared
  }) => void
): () => void
