import { Client } from '@logux/client'

import { Store, Model, subscribe } from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

class Router extends Store {
  pathname: string

  constructor (c: Client) {
    super(c)

    this.pathname = location.pathname
    window.addEventListener('popstate', () => {
      this.pathname = location.pathname
    })
  }
}

class Tooltip extends Model {
  text: string = 'test'
}

let unbind = subscribe(client, Router, current => {
  if (current.pathname === '/signout') {
    unbind()
  } else {
    console.log(current.pathname)
  }
})

subscribe(client, Tooltip, '10', tooltip => {
  console.log(tooltip.text)
})
