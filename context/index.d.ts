import type { ReadableAtom } from '../atom'

// This isn't a part of the public API for now
type Context = unknown

export type ContextGetter = <T extends ReadableAtom>(store: T) => T
export type WithCtx = {
  ctx: ContextGetter
}

export declare const globalContext: Context

export function createContext(name: string): Context
export function resetContext(name?: string): void
export function getContext(name: string): Context | undefined

export function withContext<T>(store: T, ctx: Context): T
