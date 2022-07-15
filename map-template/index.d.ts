import { MapStore } from '../map/index.js'

export interface MapTemplate<
  Value extends object = any,
  Args extends any[] = any[],
  StoreExt = {}
> {
  (id: string, ...args: Args): MapStore<Value & { id: string }> & StoreExt
  cache: {
    [id: string]: MapStore<Value & { id: string }>
  }
}

export type AnySyncTemplate = MapTemplate<
  any,
  [any] | [any, any, any, any],
  any
>

export type TemplateValue<Template> = Template extends MapTemplate<infer Value>
  ? Value & { id: string }
  : any

export type TemplateStore<Template> = Template extends MapTemplate<
  infer Value,
  any[],
  infer StoreExt
>
  ? MapStore<Value & { id: string }> & StoreExt
  : any

/**
 * Create function to build map stores. It will be like a class for store.
 *
 * @param init Store’s initializer. Returns store destructor.
 */
export function mapTemplate<
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
