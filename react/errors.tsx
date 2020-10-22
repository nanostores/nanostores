import * as React from 'react'
import { Client } from '@logux/client'

import { Store, Model } from '../index.js'
import { useStore } from './index.js'

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

let A: React.FC = () => {
  // THROWS Router' is not assignable to parameter of type 'ModelClass
  let page = useStore(Router, '10')
  return null
}

let B: React.FC = () => {
  // THROWS Tooltip' is not assignable to parameter of type 'StoreClass
  let tooltip = useStore(Tooltip)
  return null
}

let C: React.FC = () => {
  let page = useStore(Router)
  // THROWS Property 'path' does not exist on type 'Router
  return <div>{page.path}</div>
}
