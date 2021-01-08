import { Client } from '@logux/client'

import { createRouter, openPage } from '../index.js'

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
  create: [/\/post\/(new|draft)/, type => ({ type, mode: 'editor' })],
  post: '/post/:id',
  exit: '/exit'
})

let router = Router.load(client)
if (!router.page) {
  console.log('404')
} else if (router.page.name === 'post') {
  router.openUrl(`/post/${router.page.params.id}`)
  openPage(router, 'post', { id: '1' })
  openPage(router, 'home')
} else if (router.page.name === 'create') {
  console.log(router.page.params.type, router.page.params.mode)
}
