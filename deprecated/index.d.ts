import { MapStore } from '../map/index.js'

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export type AnySyncTemplate = MapTemplate<
  any,
  [any] | [any, any, any, any],
  any
>

/**
 * @deprecated
 */
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
 * @deprecated
 */
export function actionFor<
  Template extends MapTemplate,
  Callback extends (store: TemplateStore<Template>, ...args: any[]) => any
>(Template: Template, actionName: string, cb: Callback): Callback
