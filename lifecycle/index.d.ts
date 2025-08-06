import type { Store, StoreValue } from '../map/index.js'

type AtomSetPayload<Shared, SomeStore extends Store> = {
  newValue: StoreValue<SomeStore>
  shared: Shared
}

type AtomNotifyPayload<Shared, SomeStore extends Store> = {
  oldValue: StoreValue<SomeStore>
  shared: Shared
}

/**
 * Add listener to store chagings.
 *
 * You can communicate between listeners by `payload.shared`.
 *
 * New value of the all store will be `payload.newValue`.
 *
 * @param $store The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onSet<Shared = never, SomeStore extends Store = Store>(
  $store: SomeStore,
  listener: (payload: AtomSetPayload<Shared, SomeStore>) => void
): () => void

/**
 * Add listener to notifying about store changes.
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
  listener: (payload: AtomNotifyPayload<Shared, SomeStore>) => void
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
  initialize?: (payload: { shared: Shared }) => (() => void) | void
): () => void
