import type { AllPaths, FromPath } from '../deep-map/path.js'
import type { AnyStore } from '../map/index.js'

/**
 * Get a value by key from a store with an object value.
 * Works with `map`, `deepMap`, and `atom`.
 *
 * ```js
 * import { getKey, map } from 'nanostores'
 *
 * const $user = map({ name: 'John', profile: { age: 30 } })
 *
 * // Simple key access
 * getKey($user, 'name') // Returns 'John'
 *
 * // Nested access with dot notation
 * getKey($user, 'profile.age') // Returns 30
 *
 * // Array access
 * const $items = map({ products: ['apple', 'banana'] })
 * getKey($items, 'products[1]') // Returns 'banana'
 * ```
 *
 * @param store The store to get the value from.
 * @param key The key to access. Can be a simple key or a path with dot notation.
 * @returns The value for this key
 */

export function getKey<
  T extends Record<string, unknown>,
  K extends AllPaths<T>
>(store: AnyStore<T>, key: K): FromPath<T, K>
