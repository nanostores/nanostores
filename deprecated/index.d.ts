import type { WritableAtom, ReadableAtom } from '../atom/index.js'

import { MapStore, StoreValue, Store } from '../map/index.js'
import { MapBuilder } from '../map-template/index.js'

type StoreValues<Stores extends ReadableAtom[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

interface CreateDerived {
  <Value extends any, OriginStore extends ReadableAtom>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Value
  ): ReadableAtom<Value>
  <Value extends any, OriginStores extends ReadableAtom[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Value
  ): ReadableAtom<Value>
}

type ReaonlyIfCan<Value> = Value extends (...args: any) => any
  ? Value
  : Readonly<Value>

/**
 * @deprecated
 */
export function createStore<Value, StoreExt = {}>(
  init?: () => void | (() => void)
): WritableAtom<Value> & StoreExt

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

/**
 * @deprecated
 */
export function createMap<Value extends object, StoreExt extends object = {}>(
  init?: () => void | (() => void)
): MapStore<Value> & StoreExt

/**
 * @deprecated
 */
export function getValue<Value extends any>(
  store: ReadableAtom<Value>
): ReaonlyIfCan<Value>

/**
 * @deprecated
 */
export function keepActive(store: Store | MapBuilder | AnySyncBuilder): void

/**
 * @deprecated
 */
export type ReadableStore = ReadableAtom
