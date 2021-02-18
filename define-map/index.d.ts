import { MapStore } from '../create-map/index.js'

export type MapStoreBuilder<
  V extends object = any,
  A extends any[] = any[],
  E = {}
> = (id: string, ...args: A) => MapStore<V & { id: string }> & E

export type BuilderValue<S> = S extends MapStoreBuilder<infer V>
  ? V & { id: string }
  : any

/**
 * Create function to build map stores. It will be like a class for store.
 *
 * @param init Store’s initializer.
 */
export function defineMap<V extends object, A extends any[] = [], E = {}> (
  init?: (
    store: MapStore<V & { id: string }> & E,
    id: string,
    ...args: A
  ) => void | (() => void)
): MapStoreBuilder<V, A, E>
