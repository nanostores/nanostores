import {
  AnySyncTemplate,
  TemplateStore,
  TemplateValue,
  MapTemplate
} from '../map-template/index.js'
import {
  MapStore,
  StoreValue,
  Store,
  WritableStore,
  MapStoreKeys
} from '../map/index.js'
import { WritableAtom, ReadableAtom } from '../atom/index.js'

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

type ReadonlyIfCan<Value> = Value extends (...args: any) => any
  ? Value
  : Readonly<Value>

/**
 * @deprecated Use atom
 */
export function createStore<Value, StoreExt = {}>(
  init?: () => void | (() => void)
): WritableAtom<Value> & StoreExt

/**
 * @deprecated Use computed
 */
export const createDerived: CreateDerived

/**
 * @deprecated Use mapTemplate
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
): MapTemplate<Value, Args, StoreExt>

/**
 * @deprecated Use map
 */
export function createMap<Value extends object, StoreExt extends object = {}>(
  init?: () => void | (() => void)
): MapStore<Value> & StoreExt

/**
 * @deprecated Use get method of the store
 */
export function getValue<Value extends any>(
  store: ReadableAtom<Value>
): ReadonlyIfCan<Value>

/**
 * @deprecated use keepMount
 */
export function keepActive(store: Store | MapTemplate | AnySyncTemplate): void

/**
 * @deprecated
 */
export type ReadableStore<V = any> = ReadableAtom<V>

/**
 * @deprecated
 */
export type MapBuilder<
  V extends object = any,
  A extends any[] = any[],
  E = {}
> = MapTemplate<V, A, E>

/**
 * @deprecated
 */
export type BuilderValue<T> = TemplateValue<T>

/**
 * @deprecated
 */
export type BuilderStore<T> = TemplateStore<T>

/**
 * @deprecated Use startTask
 */
export function startEffect(): () => void

/**
 * @deprecated Use task
 */
export function effect<Return = never>(
  cb: () => Promise<Return> | Return
): Promise<Return>

/**
 * @deprecated Use allTasks
 */
export function allEffects(): Promise<void>

/**
 * @deprecated Use cleanTasks
 */
export function clearEffects(): void

/**
 * @deprecated No analogs in the new API. Use store.set({ ...store.get(), someProp: newValue })
 */
export function update<SomeStore extends WritableStore>(
  store: SomeStore,
  updater: (value: StoreValue<SomeStore>) => StoreValue<SomeStore>
): void

/**
 * @deprecated No analogs in the new API. Use something like store.setKey('someProp', store.get().someProp + 1)
 */
export function updateKey<
  SomeStore extends MapStore,
  Key extends MapStoreKeys<SomeStore>
>(
  store: SomeStore,
  key: Key,
  updater: (value: StoreValue<SomeStore>[Key]) => StoreValue<SomeStore>[Key]
): void
