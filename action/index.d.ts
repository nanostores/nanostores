import { MapTemplate, TemplateStore } from '../map-template/index.js'
import { WritableStore } from '../map/index.js'

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R
  ? (...args: P) => R
  : never

export const lastAction: unique symbol

/**
 * Action is a function which change the store.
 *
 * This wrap allows DevTools to see the name of action, which changes the store.
 *
 * ```js
 * export const increase = action(counter, 'increase', (value = 1) => {
 *   if (validateMax(counter.get())) {
 *     counter.set(counter.get() + value)
 *   }
 * })
 *
 * increase()
 * increase(5)
 * ```
 *
 * @param store Store instance.
 * @param actionName Action name for logs.
 * @param cb Function changing the store.
 * @returns Wrapped function with the same arguments.
 */
export function action<
  SomeStore extends WritableStore,
  Callback extends (store: SomeStore, ...args: any[]) => any
>(store: SomeStore, actionName: string, cb: Callback): OmitFirstArg<Callback>

/**
 * Create action for multiple stores of some map template.
 *
 * ```js
 * export const increase = action(Counter, 'increase', (counter, value = 1) => {
 *   if (validateMax(counter.get())) {
 *     counter.set(counter.get() + value)
 *   }
 * })
 *
 * increase(counterA)
 * increase(counterB, 5)
 * ```
 */
export function actionFor<
  Template extends MapTemplate,
  Callback extends (store: TemplateStore<Template>, ...args: any[]) => any
>(Template: Template, actionName: string, cb: Callback): Callback
