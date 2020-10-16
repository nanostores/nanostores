import { Client } from '@logux/client'

import {
  initLocalStore,
  ObjectSpace,
  LocalStore,
  LocalModel,
  Store
} from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

class BadRouter extends LocalModel {
  pathname?: string
}

class GoodRouter extends LocalStore {
  pathname?: string
}

// THROWS BadRouter' is not assignable to parameter of type 'LocalStoreClass'
initLocalStore(client, BadRouter, current => {
  console.log(current)
})

initLocalStore(client, GoodRouter, current => {
  // THROWS Property 'path' does not exist on type 'GoodRouter'.
  console.log(current.path)
})

// THROWS is not assignable to parameter of type 'LocalStoreClass'
initLocalStore(client, LocalStore, current => {
  console.log(current)
})
