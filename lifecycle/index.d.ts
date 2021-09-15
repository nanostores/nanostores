import type { WritableStore, ReadableStore } from '../atom/index.js'

type Store<Data> = WritableStore<Data> | ReadableStore<Data>

export function onSet<Data>(
  store: Store<Data>,
  handler: (payload: {
    original: unknown[]
    shared: any
    event: { stop(): void }
    methods: { abort(): void }
  }) => void
)

export function onChange<Data>(
  store: Store<Data>,
  handler: (payload: {
    original: unknown[]
    shared: any
    event: { stop(): void }
    methods: { abort(): void }
  }) => void
)

export function onCreate<Data>(
  store: Store<Data>,
  handler: (payload: { shared: any }) => void
)

export function onOff<Data>(
  store: Store<Data>,
  handler: (payload: { shared: any }) => void
)
