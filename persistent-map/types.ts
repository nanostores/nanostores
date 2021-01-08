import { Client } from '@logux/client'

import { PersistentMap } from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

class Settings extends PersistentMap {
  static id = 'settings'
  favorite?: string
  theme: 'light' | 'dark' = 'light'
}

Settings.subscribe((store, diff) => {
  console.log(diff.theme)
})

let settings = Settings.load(client)
settings.change('theme', 'dark')
settings.change('favorite', '1')
settings.remove('favorite')
