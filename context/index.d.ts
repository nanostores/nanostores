import type { ReadableAtom } from '../atom'

// This isn't a part of the public API for now
type Context = unknown

export type ContextGetter = <T extends ReadableAtom>(store: T) => T
export type WithCtx = {
  ctx: ContextGetter
}

export declare const globalContext: Context

export function createContext(id: string, storeValues?: object): Context
export function resetContext(id?: string): void
export function getContext(id: string): Context | undefined
export function serializeContext(id: string): string

export function withContext<T>(store: T, ctx: Context): T
