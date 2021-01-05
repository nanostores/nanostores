import { Client } from '@logux/client'

import { SyncMap } from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

class User extends SyncMap {
  name!: string
  age?: number
}

let user = User.load('user:id', client)
// THROWS { firstName: string; }' is not assignable to parameter
user.change({ firstName: 'Ivan' })
// THROWS 'string' is not assignable to type 'number | undefined'
user.change({ age: '26' })
// THROWS is not assignable to parameter of type 'MapDiff<User>'
user.change({ id: '26' })
// THROWS firstName"' is not assignable to parameter of type '"name" | "age"
user.change('firstName', 'Ivan')
// THROWS '"26"' is not assignable to parameter of type 'number | undefined'
user.change('age', '26')
// THROWS '"id"' is not assignable to parameter of type '"name" | "age"
user.change('id', '26')
