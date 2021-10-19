import { MapTemplate, TemplateStore } from '../map-template/index.js'
import { Store, MapStore, StoreValue } from '../map/index.js'

/**
 * Add listener to store chagings.
 *
 * ```js
 * import { onSet } from 'nanostores'
 *
 * onSet(store, ({ newValue, abort }) => {
 *   if (!validate(newValue)) {
 *     abort()
 *   }
 * })
 * ```
 *
 * You can communicate between listeners by `payload.share`
 * or cancel changes by `payload.abort()`.
 *
 * @param store The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onSet<Shared = never, SomeStore extends Store>(
  store: SomeStore,
  listener: (payload: {
    changed: SomeStore extends MapStore ? keyof StoreValue<SomeStore> : never
    newValue: StoreValue<SomeStore>
    shared: Shared
    abort(): void
  }) => void
): () => void

/**
 * Add listener to notifing about store changes.
 *
 * You can communicate between listeners by `payload.share`
 * or cancel changes by `payload.abort()`.
 *
 * @param store The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onNotify<Shared = never, SomeStore extends Store>(
  store: SomeStore,
  listener: (payload: {
    changed: SomeStore extends MapStore ? keyof StoreValue<SomeStore> : never
    shared: Shared
    abort(): void
  }) => void
): () => void

/**
 * Add listener on first store listener.
 *
 * See {@link onMount} to add constructor and destructor for the store.
 *
 * You can communicate between listeners by `payload.share`.
 *
 * @param store The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onStart<Shared = never>(
  store: Store,
  listener: (payload: { shared: Shared }) => void
): () => void

/**
 * Add listener on last store listener unsubscription.
 *
 * See {@link onMount} to add constructor and destructor for the store.
 *
 * You can communicate between listeners by `payload.share`.
 *
 * @param store The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onStop<Shared = never>(
  store: Store,
  listener: (payload: { shared: Shared }) => void
): () => void

/**
 * Add listener for store creation from map template.
 *
 * ```js
 * import { onBuild, onSet } from 'nanostores'
 *
 * onBuild(User, ({ store }) => {
 *   onSet(store, ({ newValue, abort }) => {
 *     if (!validate(newValue)) abort()
 *   })
 * })
 * ```
 *
 * You can communicate between listeners by `payload.share`.
 *
 * @param Template The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onBuild<Shared = never, Template extends MapTemplate>(
  Template: Template,
  listener: (payload: {
    shared: Shared
    store: TemplateStore<Template>
  }) => void
): () => void

export const STORE_UNMOUNT_DELAY: number

/**
 * Run constructor on first store’s listener and run destructor on last listener
 * unsubscription.
 *
 * A way to reduce memory and CPU usage when you do not need a store.
 *
 * ```js
 * import { onMount } from 'nanostores'
 *
 * // Listen for URL changes on first store’s listener.
 * onMount(router, {
 *   parse()
 *   window.addEventListener('popstate', parse)
 *   return () => {
 *     window.removeEventListener('popstate', parse)
 *   }
 * })
 * ```
 *
 * @param store Store to listen.
 * @param initialize Store constructor.
 * @return A function to remove constructor and destructor from store.
 */
export function onMount(store: Store, initialize: () => void): () => void
