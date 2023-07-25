import type { ReadableAtom } from '../atom'

// This isn't a part of the public API for now
type Context = unknown

export type ContextGetter = <T extends ReadableAtom>(store: T) => T
export type WithCtx = {
  ctx: ContextGetter
}

export declare const globalContext: Context

export function createContext(storeValues?: object): Context
export function createLocalContext(
  parentContext: Context,
  id: string,
  storeValues?: object
): Context
export function resetContext(context?: Context): void
export function serializeContext(context: Context): string

export function withContext<T>(storeOrAction: T, ctx: Context): T
