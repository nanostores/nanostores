import { MapBuilder, BuilderStore } from '../map-template/index.js'
import { Store, MapStore } from '../map/index.js'
import { Atom } from '../atom/index.js'

interface OnSet {
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
  <Shared = never, Value = any>(
    store: Atom<Value>,
    listener: (payload: {
      newValue: Value
      shared: Shared
      abort(): void
    }) => void
  ): () => void
  <Shared = never, Value extends object = any>(
    store: MapStore<Value>,
    listener: (payload: {
      changed: keyof Value
      newValue: Value
      shared: Shared
      abort(): void
    }) => void
  ): () => void
}

export const onSet: OnSet

interface OnNotify {
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
  <Shared = never, Value>(
    store: Atom<Value>,
    listener: (payload: { shared: Shared; abort(): void }) => void
  ): () => void
  <Shared = never, Value>(
    store: MapStore<Value>,
    listener: (payload: {
      changed: keyof Value
      shared: Shared
      abort(): void
    }) => void
  ): () => void
}

export const onNotify: OnNotify

/**
 * Add listener on first store listener.
 *
 * See {@link mount} to add constructor and destructor for the store.
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
 * See {@link mount} to add constructor and destructor for the store.
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
 * @param Builder The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 */
export function onBuild<Shared = never, Builder extends MapBuilder>(
  Builder: Builder,
  listener: (payload: { shared: Shared; store: BuilderStore<Builder> }) => void
): () => void
