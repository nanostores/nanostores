import { ReadableStore, StoreValue } from '../create-store/index.js'

type StoreValues<Stores extends ReadableStore[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

interface CreateDerived {
  <Value extends any, OriginStore extends ReadableStore>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Value
  ): ReadableStore<Value>
  <Value extends any, OriginStores extends ReadableStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Value
  ): ReadableStore<Value>
}

/**
 * @deprecated
 */
export const createDerived: CreateDerived
