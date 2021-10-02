import type { Store } from '../atom/index.js'

/**
 * Add listener to store chagings.
 *
 * ```js
 * import { onSet } from 'nanostores'
 *
 * onSet(store, payload => {
 *
 * })
 * ```
 *
 * You can communicate between listeners by `payload.share`
 * or cancel changes by `payload.abort()`.
 *
 * @param store The store to add listener.
 * @param listener Event callback.
 */
export function onSet<Value, Shared = never>(
  store: Store<Value>,
  listener: (payload: { args: [Value]; shared: Shared; abort(): void }) => void
)

/**
 * Add listener to notifing about store changes.
 *
 * ```js
 * import { onNotify } from 'nanostores'
 *
 * onNotify(store, payload => {
 *
 * })
 * ```
 *
 * You can communicate between listeners by `payload.share`
 * or cancel changes by `payload.abort()`.
 *
 * @param store The store to add listener.
 * @param listener Event callback.
 */
export function onNotify<Data, Shared = never>(
  store: Store<Data>,
  listener: (payload: {
    args: [string?]
    shared: Shared
    abort(): void
  }) => void
)

/**
 * Add listener on first store listener.
 *
 * ```js
 * import { onStart } from 'nanostores'
 *
 * onStart(store, payload => {
 *
 * })
 * ```
 *
 * You can communicate between listeners by `payload.share`.
 *
 * @param store The store to add listener.
 * @param listener Event callback.
 */
export function onStart<Data, Shared = never>(
  store: Store<Data>,
  listener: (payload: { shared: Shared }) => void
)

/**
 * Add listener on last store listener unsubscription.
 *
 * ```js
 * import { onStop } from 'nanostores'
 *
 * onStop(store, payload => {
 *
 * })
 * ```
 *
 * You can communicate between listeners by `payload.share`.
 *
 * @param store The store to add listener.
 * @param listener Event callback.
 */
export function onStop<Data, Shared = never>(
  store: Store<Data>,
  listener: (payload: { shared: Shared }) => void
)
