import type { WritableStore, ReadableStore } from '../atom/index.js'

type Store<Data> = WritableStore<Data> | ReadableStore<Data>

export function onSet<Data>(
  store: Store<Data>,
  handler: (payload: {
    original: unknown[]
    shared: any
    stop(): void
    abort(): void
  }) => void
)

export function onChange<Data>(
  store: Store<Data>,
  handler: (payload: {
    original: unknown[]
    shared: any
    stop(): void
    abort(): void
  }) => void
)

export function onCreate<Data>(
  store: Store<Data>,
  handler: (payload: { shared: any }) => void
)

export function onStop<Data>(
  store: Store<Data>,
  handler: (payload: { shared: any }) => void
)

export const container: Map<Store<unknown>, unknown>
