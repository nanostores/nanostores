import { createRouter, openPage, redirectPage } from '../index.js'

interface Routes {
  home: void
  create: 'type' | 'mode'
  post: 'id'
  exit: void
}

let router = createRouter<Routes>({
  home: '/',
  create: [/\/post\/(new|draft)/, type => ({ type, mode: 'editor' })],
  post: '/post/:id',
  exit: '/exit'
})

router.subscribe(page => {
  if (!page) {
    console.log('404')
  } else if (page.route === 'post') {
    router.open(`/post/${page.params.id}`)
    openPage(router, 'post', { id: '1' })
    openPage(router, 'home')
    redirectPage(router, 'post', { id: '1' })
    redirectPage(router, 'home')
  } else if (page.route === 'create') {
    console.log(page.params.type, page.params.mode)
  }
})
