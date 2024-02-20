import type { MapStore } from '../map/index.js'

export interface MapCreator<
  Value extends object = any,
  Args extends any[] = []
> {
  (id: string, ...args: Args): MapStore<Value>
  build(id: string, ...args: Args): MapStore<Value>
  cache: {
    [id: string]: MapStore<Value & { id: string }>
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
  StoreExt = {}
>(
  init?: (
    store: MapStore<Value & { id: string }> & StoreExt,
    id: string,
    ...args: Args
  ) => (() => void) | void
): MapCreator<Value, Args>
