import { Store, StoreValue } from '../create-store/index.js'

type StoreValues<Stores extends Store[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

interface CreateDerived {
  <Value, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Value
  ): Store<Value>
  <Value, OriginStores extends Store[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Value
  ): Store<Value>
}

/**
 * Create derived store, which use generates value from another stores.
 *
 * ```js
 * import { createDerived } from '@logux/state'
 *
 * import { users } from './users.js'
 *
 * export const admins = createDerived(users, list => {
 *   return list.filter(user => user.isAdmin)
 * })
 * ```
 */
export const createDerived: CreateDerived
