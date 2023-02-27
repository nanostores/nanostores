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

/**
 * Get a value by object path. Undefined if key is missing.
 *
 * ```
 * import { getPath } from 'nanostores'
 *
 * getPath({ a: { b: { c: ['hey', 'how are you?'] } } }, 'a.b.c[1]')
 * // Returns 'how are you?'
 * ```
 *
 * @param obj Any object you want to get a deep path of
 * @param path Path splitted by dots. Arrays accessed the same as in JS: props.arr[1].nested
 * @returns The value for this path. Undefined if key is missing.
 */
export function getPath<
  T extends Record<string, unknown>,
  K extends Call<Objects.AllPaths, T>
>(obj: T, path: K): GetFromPath<T, K>

/**
 * Set a deep value by key. Initialized arrays with `undefined` if you set arbitrary length.
 *
 * ```
 * import { setPath } from 'nanostores'
 *
 * setPath({ a: { b: { c: [] } } }, 'a.b.c[1]', 'hey')
 * // Returns `{ a: { b: { c: [undefined, 'hey'] } } }`
 * ```
 *
 * @param obj Any object
 * @param path Path splitted by dots. Arrays accessed like in JS: props.arr[1].nested
 * @returns The new object. The reference changes when you change a root property.
 */
export function setPath<
  T extends Record<string, unknown>,
  K extends Call<Objects.AllPaths, T>
>(obj: T, path: K, value: GetFromPath<T, K>): T
