import { Client } from '@logux/client'

import { Store, Model, subscribe } from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

class Router extends Store {
  pathname: string = '/'
}

class Tooltip extends Model {
  text: string = 'test'
}

// THROWS 'typeof Tooltip' is not assignable to parameter of type 'StoreClass
subscribe(client, Tooltip, () => { })

subscribe(client, Router, page => {
  // THROWS Property 'path' does not exist on type 'Router'
  console.log(page.path)
})

// THROWS 'typeof Router' is not assignable to parameter of type 'ModelClass
subscribe(client, Router, 10, page => {
  console.log(page)
})
