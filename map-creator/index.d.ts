import type { MapStore } from '../map/index.js'

export interface MapCreator<
  Value extends object = any,
  Args extends any[] = []
> {
  (id: string, ...args: Args): MapStore<{ id: string } & Value>
  build(id: string, ...args: Args): MapStore<{ id: string } & Value>
  cache: {
    [id: string]: MapStore<{ id: string } & Value>
  }
}

/**
 * Create function to create map stores. It will be like a class for store.
 *
 * @param init Store’s initializer. Returns store destructor.
 */
export function mapCreator<
  Value extends object,
  Args extends any[] = [],
  StoreExt extends object = object
>(
  init?: (
    store: MapStore<{ id: string } & Value> & StoreExt,
    id: string,
    ...args: Args
  ) => (() => void) | void
): MapCreator<Value, Args>
