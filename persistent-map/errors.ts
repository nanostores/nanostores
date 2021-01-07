import { Client } from '@logux/client'

import { PersistentMap, subscribe } from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

class Settings extends PersistentMap {
  static id = 'settings'
  opt?: string
  theme: 'light' | 'dark' = 'light'
}

let settings = Settings.load(client)
// THROWS "1"' is not assignable to parameter of type '"light" | "dark"
settings.change('theme', '1')
// THROWS '"option"' is not assignable to parameter of type
settings.change('option', '1')
// THROWS '"theme"' is not assignable to parameter of type '"opt"'
settings.remove('theme')

settings[subscribe]((store, diff) => {
  // THROWS 'light' does not exist on type
  console.log(diff.light)
})
