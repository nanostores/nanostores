import { Client } from '@logux/client'

import { createRouter, openPage, createLocalStore } from '../index.js'

let client = new Client({
  subprotocol: '1.0.0',
  server: 'ws://localhost',
  userId: '10'
})

interface Routes {
  home: void
  create: 'type' | 'mode'
  post: 'id'
  exit: void
}

let Router = createRouter<Routes>({
  home: '/',
  // THROWS "type" | "mode"
  create: [/\/post\/(new|draft)/, type => ({ mode: 'editor' })],
  post: '/post/:id',
  exit: '/exit'
})

createLocalStore(client, Router, router => {
  if (!router.page) {
    console.log('404')
  } else if (router.page.name === 'post') {
    // THROWS 'type' does not exist on type 'Params<"id">'
    router.openUrl(`/post/${router.page.params.type}`)
    // THROWS category: string; }' is not assignable to parameter
    openPage(router, 'post', { id: '1', category: 'guides' })
    // THROWS Expected 2 arguments, but got 3
    openPage(router, 'home', { id: '1' })
  // THROWS '"exit" | "home" | "create"' and '"creat"' have no overlap
  } else if (router.page.name === 'creat') {
    console.log('create')
  }
})

createLocalStore(client, Router, router => {
  // THROWS Object is possibly 'undefined'
  console.log(router.page.name)
})
