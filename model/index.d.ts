import { Store, ObjectSpace } from '../store/index.js'

/**
 * Base class to be used in model classes.
 *
 * Model is a store for item with ID. For instance, `posts` list is a store,
 * but post with ID 1 and post with ID 2 are different models.
 */
export abstract class Model extends Store {
  static withId: true

  /**
   * @param client The storage to cache objects and optionally action log.
   * @param id The model ID.
   */
  constructor (client: ObjectSpace, id: string)

  /**
   * The model ID.
   */
  id: string
}

export type ModelClass = new (client: ObjectSpace, id: string) => Model
