import { MapStore } from '../create-map/index.js'

export interface MapBuilder<
  Value extends object = any,
  Args extends any[] = any[],
  StoreExt = {}
> {
  (id: string, ...args: Args): MapStore<Value & { id: string }> & StoreExt
  cache: {
    [id: string]: MapStore<Value & { id: string }>
  }
}

export type AnySyncBuilder = MapBuilder<any, [any] | [any, any, any, any], any>

export type BuilderValue<Builder> = Builder extends MapBuilder<infer Value>
  ? Value & { id: string }
  : any

export type BuilderStore<Builder> = Builder extends MapBuilder<
  infer Value,
  any[],
  infer StoreExt
>
  ? MapStore<Value & { id: string }> & StoreExt
  : any

/**
 * Create function to build map stores. It will be like a class for store.
 *
 * @param init Store’s initializer.
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
