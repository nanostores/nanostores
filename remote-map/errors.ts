import { Client } from '@logux/client'

import { RemoteMap, subscribe } from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

class User extends RemoteMap {
  name: string | undefined
  age: number | undefined
}

subscribe(client, User, 'user:10', user => {
  // THROWS firstName"' is not assignable to parameter of type '"name" | "age"'
  user.change('firstName', 'Ivan')
  // THROWS '"26"' is not assignable to parameter of type 'number | undefined'
  user.change('age', '26')
  // THROWS '"id"' is not assignable to parameter of type '"name" | "age"'
  user.change('id', '26')
})
