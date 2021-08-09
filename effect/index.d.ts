/**
 * Track store async effect by start/end functions.
 * It is useful for test to wait end of the processing.
 *
 * It you use `async`/`await` in effect, you can use {@link wrapEffect}.
 *
 * ```ts
 * import { startEffect, getValue } from 'nanostores'
 *
 * function saveUser () {
 *   const endEffect = startEffect()
 *   api.submit('/user', getValue(user), () => {
 *     user.setKey('saved', true)
 *     endEffect()
 *   })
 * }
 * ```
 */
export function startEffect(): () => void

/**
 * Track store async effect by wrapping promise callback.
 * It is useful for test to wait end of the processing.
 *
 * ```ts
 * import { effect, getValue } from 'nanostores'
 *
 * function saveUser () {
 *   await effect(async () => {
 *     await api.submit('/user', getValue(user))
 *     user.setKey('saved', true)
 *   })
 * }
 * ```
 *
 * @param cb Async callback with effect.
 * @return Return value from callback.
 */
export function effect<Return = never>(
  cb: () => Promise<Return> | Return
): Promise<Return>

/**
 * Return Promise until all current effects (and effects created while waiting).
 *
 * It is useful in tests to wait all async processes in the stores.
 *
 * ```ts
 * import { allEffects, getValue } from 'nanostores'
 *
 * it('saves user', async () => {
 *   saveUser()
 *   await allEffects()
 *   expect(getValue(user).saved).toBe(true)
 * })
 * ```
 */
export function allEffects(): Promise<void>

/**
 * Forget all tracking effects. Use it only for tests.
 * {@link cleanStores} cleans effects automatically.
 *
 * ```js
 * import { cleanEffects } from 'nanostores'
 *
 * afterEach(() => {
 *   cleanEffects()
 * })
 * ```
 */
export function clearEffects(): void
