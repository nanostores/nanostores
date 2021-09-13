import { WritableStore, ReadableStore, StoreValue } from '../atom/index.js'
import { MapBuilder } from '../map-template/index.js'
import { MapStore } from '../map/index.js'

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
export function createStore<Value, StoreExt = {}>(
  init?: () => void | (() => void)
): WritableStore<Value> & StoreExt

/**
 * @deprecated
 */
export const createDerived: CreateDerived

/**
 * @deprecated
 */
export function defineMap<
  Value extends object,
  Args extends any[] = [],
  StoreExt = {}
>(
  init?: (
    store: MapStore<Value & { id: string }> & StoreExt,
    id: string,
    ...args: Args
  ) => void | (() => void)
): MapBuilder<Value, Args, StoreExt>
