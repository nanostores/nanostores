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

class User extends Model {
  modelName = 'user'
  modelLoaded = false
  modelLoading = Promise.resolve()
  login?: string
}

let A: React.FC = () => {
  let page = useStore(Router)
  return <div>{page.pathname}</div>
}

let B: React.FC = () => {
  let tooltip = useStore(Tooltip, 'tooltip:10')
  return <div>{tooltip.text}</div>
}

let Users: React.FC = () => {
  let [isLoading, user] = useStore(User, 'user:10')
  if (isLoading) {
    return <div>Loading</div>
  } else {
    return <div>{user.login}</div>
  }
}
