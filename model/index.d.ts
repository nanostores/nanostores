import { Client } from '@logux/client'

import { BaseState } from '../store/index.js'

/**
 * Base class to be used in model classes.
 *
 * Model is a store for item with ID. For instance, `posts` list is a store,
 * but post with ID 1 and post with ID 2 are different models.
 *
 * Model should have unique IDs accorss the system, not just accorss all models
 * with the same type. Use Nano ID or prefix like `tooltip:error`.
 *
 * ```js
 * import { Model } from '@logux/state'
 *
 * export class Tooltip extends Model {
 *   text = i18n.t(this.id)
 * }
 * ```
 */
export abstract class Model extends BaseState {
  /**
   * Model ID.
   */
  id: string

  /**
   * @param client The storage to cache objects and optionally action log.
   * @param id Model ID.
   */
  constructor (client: Client, id: string)
}

export type ModelClass = new (client: Client, id: string) => Model
