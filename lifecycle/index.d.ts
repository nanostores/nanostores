import { Store, MapStore } from '../map/index.js'
import { Atom } from '../atom/index.js'

interface OnSet {
  /**
   * Add listener to store chagings.
   *
   * ```js
   * import { onSet } from 'nanostores'
   *
   * onSet(mapStore, ({ key, newValue, abort }) => {
   *   if (key) {
   *     if (validateKey(key, newValue)) abort()
   *   } else {
   *     if (validateAll(newValue) abort()
   *   }
   * })
   * ```
   *
   * You can communicate between listeners by `payload.share`
   * or cancel changes by `payload.abort()`.
   *
   * @param store The store to add listener.
   * @param listener Event callback.
   */
  <Shared = never, Value = any>(
    store: Atom<Value>,
    listener: (payload: {
      newValue: Value
      shared: Shared
      abort(): void
    }) => void
  )
  <Shared = never, Value extends object = any, Key extends keyof Value>(
    store: MapStore<Value>,
    listener: (
      payload:
        | {
            changed: undefined
            newValue: Value
            shared: Shared
            abort(): void
          }
        | {
            changed: Key
            newValue: Value[Key]
            shared: Shared
            abort(): void
          }
    ) => void
  )
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
   */
  <Shared = never, Value>(
    store: Atom<Value>,
    listener: (payload: { shared: Shared; abort(): void }) => void
  )
  <Shared = never, Value>(
    store: MapStore<Value>,
    listener: (payload: {
      changed: keyof Value
      shared: Shared
      abort(): void
    }) => void
  )
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
 */
export function onStart<Shared = never>(
  store: Store,
  listener: (payload: { shared: Shared }) => void
)

/**
 * Add listener on last store listener unsubscription.
 *
 * See {@link mount} to add constructor and destructor for the store.
 *
 * You can communicate between listeners by `payload.share`.
 *
 * @param store The store to add listener.
 * @param listener Event callback.
 */
export function onStop<Shared = never>(
  store: Store,
  listener: (payload: { shared: Shared }) => void
)
