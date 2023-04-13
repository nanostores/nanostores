import { MapStore } from '../map/index.js'

export interface MapTemplate<
  Value extends object = any,
  Args extends any[] = any[],
  StoreExt = {}
> {
  (id: string, ...args: Args): MapStore<Value & { id: string }> & StoreExt
  cache: {
    [id: string]: MapStore<Value & { id: string }>
  }
}

export type AnySyncTemplate = MapTemplate<
  any,
  [any] | [any, any, any, any],
  any
>

export type TemplateValue<Template> = Template extends MapTemplate<infer Value>
  ? Value & { id: string }
  : any

export type TemplateStore<Template> = Template extends MapTemplate<
  infer Value,
  any[],
  infer StoreExt
>
  ? MapStore<Value & { id: string }> & StoreExt
  : any

/**
 * Create function to build map stores. It will be like a class for store.
 *
 * @param init Store’s initializer. Returns store destructor.
 *
 * @deprecated
 */
export function mapTemplate<
  Value extends object,
  Args extends any[] = [],
  StoreExt = {}
>(
  init?: (
    store: MapStore<Value & { id: string }> & StoreExt,
    id: string,
    ...args: Args
  ) => void | (() => void)
): MapTemplate<Value, Args, StoreExt>

/**
 * Add listener for store creation from map template.
 *
 * ```js
 * import { onBuild, onSet } from 'nanostores'
 *
 * onBuild(User, ({ store }) => {
 *   onSet(store, ({ newValue, abort }) => {
 *     if (!validate(newValue)) abort()
 *   })
 * })
 * ```
 *
 * You can communicate between listeners by `payload.shared`.
 *
 * @param Template The store to add listener.
 * @param listener Event callback.
 * @returns A function to remove listener.
 *
 * @deprecated
 */
export function onBuild<
  Shared = never,
  Template extends MapTemplate = MapTemplate
>(
  Template: Template,
  listener: (payload: {
    shared: Shared
    store: TemplateStore<Template>
  }) => void
): () => void

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
 *
 * @deprecated
 */
export function actionFor<
  Template extends MapTemplate,
  Callback extends (store: TemplateStore<Template>, ...args: any[]) => any
>(Template: Template, actionName: string, cb: Callback): Callback
