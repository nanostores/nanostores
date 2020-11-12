import { Client } from '@logux/client'

import { RemoteMap, subscribe } from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

class User extends RemoteMap {
  static modelsName = 'users'

  name: string | undefined
  age: number | undefined
}

subscribe(client, User, 'user:10', user => {
  user.change('name', 'Ivan')
  user.change('age', 26)
})
