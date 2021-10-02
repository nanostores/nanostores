import { ReadableAtom, WritableAtom } from '../atom/index.js'
import { Store, MapStore } from '../map/index.js'

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
    store: ReadableAtom<Value> | WritableAtom<Value>,
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
            newValue: Value
            shared: Shared
            abort(): void
          }
        | {
            key: Key
            newValue: Value[Key]
            shared: Shared
            abort(): void
          }
    ) => void
  )
}

export const onSet: OnSet

/**
 * Add listener to notifing about store changes.
 *
 * You can communicate between listeners by `payload.share`
 * or cancel changes by `payload.abort()`.
 *
 * @param store The store to add listener.
 * @param listener Event callback.
 */
export function onNotify<Shared = never, Value>(
  store: Store<Value>,
  listener: (payload: {
    changed: keyof Value | undefined
    shared: Shared
    abort(): void
  }) => void
)

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
