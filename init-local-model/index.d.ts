import { Unsubscribe } from 'nanoevents'

import { LocalModelClass } from '../local-model/index.js'
import { ObjectSpace } from '../store/index.js'

/**
 * Load store, call `listener` and call `listener` again on any store changes.
 *
 * Object space tracks model listener and will destroy a model, when
 * all listeners will be unsibscribed.
 *
 * ```js
 * const unbind = initLocalModel(client, Tooltip, id, tooltip => {
 *   renderTooltip(tooltip)
 * })
 * ```
 *
 * @param client Object space for all models.
 * @param modelClass Class of the model.
 * @param id The model ID.
 * @param listener Callback to be called right now and on any model changes.
 * @returns Unsubscribe function.
 */
export function initLocalModel<T extends LocalModelClass> (
  client: ObjectSpace,
  modelClass: T,
  id: string,
  listener: (model: InstanceType<T>) => void
): Unsubscribe
