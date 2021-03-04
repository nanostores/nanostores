import { Store, StoreValue } from '../create-store/index.js'

type StoreValues<S extends Store[]> = {
  [K in keyof S]: StoreValue<S[K]>
}

interface CreateDerived {
  <V, S extends Store>(stores: S, cb: (value: StoreValue<S>) => V): Store<V>
  <V, SS extends Store[]>(
    stores: [...SS],
    cb: (...values: StoreValues<SS>) => V
  ): Store<V>
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
