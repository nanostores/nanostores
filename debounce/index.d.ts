import type { ReadableAtom, WritableAtom } from '../atom/index.js'

export function timeoutDebounce<T>(
  inAtom: WritableAtom<T>,
  timeout = 0
): ReadableAtom<T>
