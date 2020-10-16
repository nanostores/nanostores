import { ObjectSpace } from '../store/index.js'
import { Model } from '../model/index.js'

/**
 * Abstract class for local model like tooltip.
 *
 * Model is a store for item with ID. For instance, `tooltips` list is a store,
 * but tooltip with ID 1 and tooltip with ID 2 are different models.
 */
export abstract class LocalModel extends Model {
  static local: true
}

export type LocalModelClass = new (
  client: ObjectSpace,
  id: string
) => LocalModel
