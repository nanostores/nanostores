import type { Call, Objects } from 'hotscript'
import type { GetFromPath } from 'hotscript/dist/internals/objects/impl/objects'

export type AllKeys<T extends Record<string, unknown>> = Call<
  Objects.AllPaths,
  T
>
export type GetPath<
  T extends Record<string, unknown>,
  K extends Call<Objects.AllPaths, T>
> = GetFromPath<T, K>

export function getPath<
  T extends Record<string, unknown>,
  K extends Call<Objects.AllPaths, T>
>(obj: T, path: K): GetFromPath<T, K>

export function setPath<
  T extends Record<string, unknown>,
  K extends Call<Objects.AllPaths, T>
>(obj: T, path: K, value: GetFromPath<T, K>): T
