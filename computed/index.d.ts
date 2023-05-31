import type { Autosubscribe, ReadableAtom } from '../atom/index.js'
import type { AnyStore, Store, StoreValue } from '../map/index.js'

type StoreValues<Stores extends AnyStore[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

type A = ReadableAtom<number>
type B = ReadableAtom<string>

type C = (...values: StoreValues<[A, B]>) => void

interface Computed {
  /**
   * Create derived store, which use generates value from another stores.
   *
   * Pre-defined dependencies
   *
   * ```js
   * import { computed } from 'nanostores'
   *
   * import { $users } from './users.js'
   *
   * export const $admins = computed($users, users => {
   *   return users.filter(user => user.isAdmin)
   * })
   * ```
   *
   * Inline dependencies
   *
   * ```js
   * import { computed } from 'nanostores'
   *
   * import { $users } from './users.js'
   *
   * export const $admins = computed(() => {
   *   return $users().filter(user => user.isAdmin)
   * })
   * ```
   *
   * Async
   *
   * Supports reentrant async callbacks with an {@link Autosubscribe} controller & stale checks.
   *
   * ```js
   * import { computed } from 'nanostores'
   *
   * import { $userId } from './users.js'
   *
   * computed(async use => {
   *   let user =
   *     await fetch(`https://api.com/users/${userId()}`)
   *     .then(response => response.json())
   *   if (use.stale()) return // cancel cb run if the cb is stale. return value is ignored if stale
   *   let messages =
   *     await fetch(`https://api.com/users/${userId()}/messages`)
   *     .then(response => response.json())
   *   return { user, messages } // This will be ignored if the cb is stale & set if the cb is fresh
   * })
   * ```
   *
   * Event binding & unbinding
   *
   * Supports event binding with the {@link Autosubscribe.onStart} method & unbinding with the {@link Autosubscribe.onStop} method.
   *
   * In this example, the computed will bind to an event when listened to & unbind when all listeners are removed.
   *
   * ```js
   * import { computed } from 'nanostores'
   *
   * export const $colorScheme = computed(use => {
   *  let watch = window.matchMedia('(prefers-color-scheme: dark)')
   *  let onchange = evt => use.save(evt.matches ? 'dark' : 'light')
   *  use.onStart(() => watch.addEventListener('change', onchange))
   *  use.onStop(() => watch.removeEventListener('change', onchange))
   *  return onchange(watch)
   * })
   *
   * const off = $darkMode.listen(() => {}) // activates watchMedia event listener
   * off() // deactivates watchMedia event listener
   * ```
   *
   * Helper functions & Private stores
   *
   * Supports reentrant autosubscribing helper functions & private stores inside the computed callback.
   *
   * ```js
   * const $path = atom('')
   * const $userCancel = atom(false)
   *
   * const $download = computed(use => {
   *   if (use() && use().path !== $path()) {
   *     use().stream.cancel('path changed')
   *     use.save(null)
   *   }
   *   if (!$path()) return null
   *
   *   const stream = use()?.stream || createStream()
   *   computed(() => {
   *     if ($userCancel() && stream) {
   *       stream.cancel('user cancelled')
   *       $userCancel.set(false)
   *     }
   *   })()
   *
   *   return { path: $path(), stream }
   *
   *   function createStream() {
   *     return new ReadableStream({
   *       async start(controller) {
   *         this.responsePromise = fetch(`https://downloads.com/${$path()}`)
   *         const response = await this.responsePromise
   *         await response.body.pipeTo(new WritableStream({
   *           write(content) {
   *             controller.enqueue(content)
   *           }
   *         }))
   *         controller.close()
   *       },
   *       async cancel(reason) {
   *         console.warn('Stream cancelled:', reason)
   *         const response = await this.responsePromise
   *         await response.body.cancel(reason)
   *       }
   *     })
   *   })
   * ```
   */
  <Value extends any, Asub extends Autosubscribe<Value> = Autosubscribe<Value>>(
    cb: (asub: Asub) => BoxAutosubscribe<Value, Asub> | PromiseLike<BoxAutosubscribe<Value, Asub>>
  ): ReadableAtom<UnboxAutosubscribe<Awaited<Value>>>
  <Value extends any, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => BoxAutosubscribe<Value> | PromiseLike<BoxAutosubscribe<Value>>
  ): ReadableAtom<UnboxAutosubscribe<Awaited<Value>>>
  <Value extends any, OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => BoxAutosubscribe<Value> | PromiseLike<BoxAutosubscribe<Value>>
  ): ReadableAtom<UnboxAutosubscribe<Awaited<Value>>>
}

export type BoxAutosubscribe<Value, Asub extends Autosubscribe<Value> = Autosubscribe<Value>> =
  Asub | Value
export type UnboxAutosubscribe<Value> = Value extends Autosubscribe ? never : Value

export const computed: Computed
