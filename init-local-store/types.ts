import { Client } from '@logux/client'

import { LocalStore, initLocalStore, ObjectSpace } from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

class Router extends LocalStore {
  pathname: string

  constructor (space: ObjectSpace) {
    super(space)

    this.pathname = location.pathname
    window.addEventListener('popstate', () => {
      this.pathname = location.pathname
    })
  }
}

let unbind = initLocalStore(client, Router, current => {
  if (current.pathname === '/signout') {
    unbind()
  } else {
    console.log(current.pathname)
  }
})
