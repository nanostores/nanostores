import type { WritableStore, ReadableStore } from '../atom/index.js'

export const STORE_CLEAN_DELAY: number

export function mount<Data>(
  store: WritableStore<Data> | ReadableStore<Data>,
  cb: () => void
): () => void
