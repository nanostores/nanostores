import { Store, StoreValue } from '../map/index.js'
import { ReadableAtom } from '../atom/index.js'

type StoreValues<Stores extends Store[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

interface Computed {
  <Value extends any, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Value
  ): ReadableAtom<Value>
  <Value extends any, OriginStores extends Store[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Value
  ): ReadableAtom<Value>
}

/**
 * Create derived store, which use generates value from another stores.
 *
 * ```js
 * import { computed } from 'nanostores'
 *
 * import { users } from './users.js'
 *
 * export const admins = computed(users, list => {
 *   return list.filter(user => user.isAdmin)
 * })
 * ```
 */
export const computed: Computed
