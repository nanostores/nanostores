import { Client } from '@logux/client'

import { SyncMap } from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

class User extends SyncMap {
  static plural = 'users'
  name!: string
  age?: number
}

let user = User.load(client, 'user:id')
user.change({ name: 'Ivan' })
user.change('name', 'Ivan')
user.change('age', 26)
