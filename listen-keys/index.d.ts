import type { StoreValue } from '../map/index.js'

/**
 * Listen for specific keys of the store.
 *
 * In contrast with {@link subscribeKeys} it does not call listener
 * immediately.
 *
 * ```js
 * import { listenKeys } from 'nanostores'
 *
 * listenKeys($page, ['blocked'], (value, oldValue) => {
 *   if (value.blocked) {
 *     console.log('You have no access')
 *   }
 * })
 * ```
 *
 * @param $store The store to listen.
 * @param keys The keys to listen.
 * @param listener Standard listener.
 */
export function listenKeys<
  SomeStore extends { setKey: (key: any, value: any) => void }
>(
  $store: SomeStore,
  keys: SomeStore extends { setKey: (key: infer Key, value: never) => unknown }
    ? readonly Key[]
    : never,
  listener: (
    value: StoreValue<SomeStore>,
    oldValue: StoreValue<SomeStore>,
  ) => void
): () => void

/**
 * Listen for specific keys of the store and call listener immediately.
 * Note that the oldValue and changed arguments in the listener are
 * undefined during the initial call.
 *
 * ```js
 * import { subscribeKeys } from 'nanostores'
 *
 * subscribeKeys($page, ['blocked'], (value, oldValue) => {
 *   if (value.blocked) {
 *     console.log('You have no access')
 *   }
 * })
 * ```
 *
 * @param $store The store to listen.
 * @param keys The keys to listen.
 * @param listener Standard listener.
 */
export function subscribeKeys<
  SomeStore extends { setKey: (key: any, value: any) => void }
>(
  $store: SomeStore,
  keys: SomeStore extends { setKey: (key: infer Key, value: never) => unknown }
    ? readonly Key[]
    : never,
  listener: (
    value: StoreValue<SomeStore>,
    oldValue: StoreValue<SomeStore>,
  ) => void
): () => void

/**
 * Listen for specific key paths of the store, using object path syntax as
 * passed to `getPath`.
 *
 * In contrast with {@link subscribeKeyPaths} it does not call listener
 * immediately.
 *
 * ```js
 * import { listenKeyPaths } from 'nanostores'
 *
 * listenKeyPaths($page, ['auth.blocked'], (value, oldValue) => {
 *   if (value.auth.blocked) {
 *     console.log('You have no access')
 *   }
 * })
 * ```
 *
 * @param $store The store to listen.
 * @param keyPaths Key paths splitted by dots and `[]`. Like:
 *                 `props.arr[1].nested`.
 * @param listener Standard listener.
 */
export function listenKeyPaths<
  SomeStore extends { setKey: (key: any, value: any) => void }
>(
  $store: SomeStore,
  keyPaths: SomeStore extends { setKey: (key: infer Key, value: never) => unknown }
    ? readonly Key[]
    : never,
  listener: (
    value: StoreValue<SomeStore>,
    oldValue: StoreValue<SomeStore>,
  ) => void
): () => void

/**
 * Listen for specific key paths of the store, using object path syntax as
 * passed to `getPath`, and call listener immediately.
 * Note that the oldValue and changed arguments in the listener are
 * undefined during the initial call.
 *
 * ```js
 * import { subscribeKeys } from 'nanostores'
 *
 * subscribeKeyPaths($page, ['auth.blocked'], (value, oldValue) => {
 *   if (value.auth.blocked) {
 *     console.log('You have no access')
 *   }
 * })
 * ```
 *
 * @param $store The store to listen.
 * @param keyPaths Key paths splitted by dots and `[]`. Like:
 *                 `props.arr[1].nested`.
 * @param listener Standard listener.
 */
export function subscribeKeyPaths<
  SomeStore extends { setKey: (key: any, value: any) => void }
>(
  $store: SomeStore,
  keyPaths: SomeStore extends { setKey: (key: infer Key, value: never) => unknown }
    ? readonly Key[]
    : never,
  listener: (
    value: StoreValue<SomeStore>,
    oldValue: StoreValue<SomeStore>,
  ) => void
): () => void
