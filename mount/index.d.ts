import type { WritableStore, ReadableStore } from '../atom/index.js'

export function mount<Data>(
  store: WritableStore<Data> | ReadableStore<Data>,
  cb: () => void
): () => void
