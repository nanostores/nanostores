import { Client } from '@logux/client'

import { RemoteStore } from '../remote-store/index.js'
import { AnyClass } from '../store/index.js'

/**
 * `RemoteStore` with a check that `client` was passed to constructor.
 */
export abstract class LoguxClientStore extends RemoteStore {
  static loaded: Map<string, RemoteStore>

  static load<C extends AnyClass> (
    this: C,
    id: string,
    client: Client
  ): InstanceType<C>

  /**
   * Logux client.
   */
  loguxClient: Client

  constructor (id: string, client: Client)
}

export type LoguxClientStoreConstructor<
  S extends LoguxClientStore = LoguxClientStore
> = new (id: string, client: Client) => S
