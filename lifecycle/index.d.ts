import type { WritableStore, ReadableStore } from '../atom/index.js'

type Store<Data> = WritableStore<Data> | ReadableStore<Data>

export function onSet<Data, Shared = never>(
  store: Store<Data>,
  handler: (payload: {
    original: [Data]
    shared: Shared
    stop(): void
    abort(): void
  }) => void
)

export function onChange<Data, Shared = never>(
  store: Store<Data>,
  handler: (payload: {
    original: [string?]
    shared: Shared
    stop(): void
    abort(): void
  }) => void
)

export function onCreate<Data, Shared = never>(
  store: Store<Data>,
  handler: (payload: { shared: Shared }) => void
)

export function onStop<Data, Shared = never>(
  store: Store<Data>,
  handler: (payload: { shared: Shared }) => void
)

export const container: Map<Store<unknown>, unknown>
