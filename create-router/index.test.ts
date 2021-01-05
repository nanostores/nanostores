import { Client } from '@logux/client'

import {
  createRouter,
  getPagePath,
  CurrentPage,
  subscribe,
  openPage,
  destroy,
  Router
} from '../index.js'

let client: Client = {} as any

function changePath (path: string) {
  window.history.pushState(null, '', path)
}

function bind (router: Router): (CurrentPage | undefined)[] {
  let events: (CurrentPage | undefined)[] = []
  router[subscribe]((store: Router) => {
    events.push(store.page)
  })
  return events
}

function createTag (
  parent: HTMLElement,
  tag: string,
  attrs: { [name: string]: string } = {}
) {
  let el = document.createElement(tag)
  for (let name in attrs) {
    el.setAttribute(name, attrs[name])
  }
  parent.appendChild(el)
  return el
}

let SimpleRouter = createRouter<{
  secret: 'id'
  posts: void
  draft: 'type' | 'id'
  post: 'category' | 'id'
  home: void
}>({
  secret: '/[secret]/:id',
  posts: '/posts/',
  draft: [/\/posts\/(draft|new)\/(\d+)/, (type, id) => ({ type, id })],
  post: '/posts/:category/:id',
  home: '/'
})

let router: Router

afterEach(() => {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild)
  }
  router[destroy]()
})

it('parses current location', () => {
  changePath('/posts/guides/10')
  router = new SimpleRouter(client)
  expect(router.path).toEqual('/posts/guides/10')
  expect(router.page).toEqual({
    name: 'post',
    params: {
      category: 'guides',
      id: '10'
    }
  })
})

it('ignores last slash', () => {
  changePath('/posts/guides/10/')
  router = new SimpleRouter(client)
  expect(router.path).toEqual('/posts/guides/10')
  expect(router.page).toEqual({
    name: 'post',
    params: {
      category: 'guides',
      id: '10'
    }
  })
})

it('processes 404', () => {
  changePath('/posts/guides')
  router = new SimpleRouter(client)
  expect(router.path).toEqual('/posts/guides')
  expect(router.page).toBeUndefined()
})

it('escapes RegExp symbols in routes', () => {
  changePath('/[secret]/9')
  router = new SimpleRouter(client)
  expect(router.page).toEqual({
    name: 'secret',
    params: {
      id: '9'
    }
  })
})

it('ignores hash and search', () => {
  changePath('/posts/?id=1#top')
  router = new SimpleRouter(client)
  expect(router.path).toEqual('/posts')
  expect(router.page).toEqual({ name: 'posts', params: {} })
})

it('ignores case', () => {
  changePath('/POSTS')
  router = new SimpleRouter(client)
  expect(router.path).toEqual('/POSTS')
  expect(router.page).toEqual({ name: 'posts', params: {} })
})

it('detects URL changes', () => {
  changePath('/posts/guides/10/')
  router = new SimpleRouter(client)
  let events = bind(router)

  changePath('/')
  window.dispatchEvent(new PopStateEvent('popstate'))

  expect(router.path).toEqual('/')
  expect(router.page).toEqual({ name: 'home', params: {} })
  expect(events).toEqual([{ name: 'home', params: {} }])
})

it('unbinds events', () => {
  changePath('/posts/guides/10/')
  router = new SimpleRouter(client)
  let events = bind(router)
  router[destroy]()

  changePath('/')
  window.dispatchEvent(new PopStateEvent('popstate'))

  expect(events).toEqual([])
})

it('ignores the same URL in popstate', () => {
  changePath('/posts/guides/10/')
  router = new SimpleRouter(client)
  let events = bind(router)

  changePath('/posts/guides/10/')
  window.dispatchEvent(new PopStateEvent('popstate'))

  expect(events).toEqual([])
})

it('detects clicks', () => {
  changePath('/')
  router = new SimpleRouter(client)
  let events = bind(router)

  let link = createTag(document.body, 'a', { href: '/posts' })
  link.click()

  expect(router.path).toEqual('/posts')
  expect(router.page).toEqual({ name: 'posts', params: {} })
  expect(events).toEqual([{ name: 'posts', params: {} }])
})

it('accepts click on tag inside link', () => {
  changePath('/')
  router = new SimpleRouter(client)

  let link = createTag(document.body, 'a', { href: '/posts' })
  let span = createTag(link, 'span')
  span.click()

  expect(router.path).toEqual('/posts')
})

it('ignore non-link clicks', () => {
  changePath('/')
  router = new SimpleRouter(client)

  let span = createTag(document.body, 'span', { href: '/posts' })
  span.click()

  expect(router.path).toEqual('/')
})

it('ignores special clicks', () => {
  changePath('/')
  router = new SimpleRouter(client)

  let link = createTag(document.body, 'a', { href: '/posts' })
  let event = new MouseEvent('click', { bubbles: true, ctrlKey: true })
  link.dispatchEvent(event)

  expect(router.path).toEqual('/')
})

it('ignores other mouse button click', () => {
  changePath('/')
  router = new SimpleRouter(client)

  let link = createTag(document.body, 'a', { href: '/posts' })
  let event = new MouseEvent('click', { bubbles: true, button: 2 })
  link.dispatchEvent(event)

  expect(router.path).toEqual('/')
})

it('ignores prevented events', () => {
  changePath('/')
  router = new SimpleRouter(client)

  let link = createTag(document.body, 'a', { href: '/posts' })
  let span = createTag(link, 'span')
  span.addEventListener('click', e => {
    e.preventDefault()
  })
  span.click()

  expect(router.path).toEqual('/')
})

it('ignores new-tab links', () => {
  changePath('/')
  router = new SimpleRouter(client)

  let link = createTag(document.body, 'a', { href: '/posts', target: '_blank' })
  link.click()

  expect(router.path).toEqual('/')
})

it('ignores external links', () => {
  changePath('/')
  router = new SimpleRouter(client)
  let events = bind(router)

  let link = createTag(document.body, 'a', { href: 'http://lacalhast/posts' })
  link.click()

  expect(router.path).toEqual('/')
  expect(events).toHaveLength(0)
})

it('ignores the same URL in link', () => {
  changePath('/posts')
  router = new SimpleRouter(client)
  let events = bind(router)

  let link = createTag(document.body, 'a', { href: '/posts' })
  link.click()

  expect(events).toHaveLength(0)
})

it('respects data-ignore-router', () => {
  changePath('/')
  router = new SimpleRouter(client)

  let link = createTag(document.body, 'a', { href: '/posts' })
  link.setAttribute('data-no-router', '1')
  link.click()

  expect(router.path).toEqual('/')
})

it('opens URLs manually', () => {
  changePath('/posts/guides/10/')
  router = new SimpleRouter(client)
  let events = bind(router)

  router.openUrl('/posts/')
  expect(location.href).toEqual('http://localhost/posts/')
  expect(router.path).toEqual('/posts')
  expect(router.page).toEqual({ name: 'posts', params: {} })
  expect(events).toEqual([{ name: 'posts', params: {} }])
})

it('ignores the same URL in manuall URL', () => {
  changePath('/posts/guides/10')
  router = new SimpleRouter(client)
  let events = bind(router)

  router.openUrl('/posts/guides/10')
  expect(events).toEqual([])
})

it('allows RegExp routes', () => {
  changePath('/posts/draft/10/')
  router = new SimpleRouter(client)
  expect(router.page).toEqual({
    name: 'draft',
    params: { type: 'draft', id: '10' }
  })
})

it('generates URLs', () => {
  router = new SimpleRouter(client)
  expect(getPagePath(router, 'home')).toEqual('/')
  expect(getPagePath(router, 'posts')).toEqual('/posts')
  expect(getPagePath(router, 'post', { category: 'guides', id: '1' })).toEqual(
    '/posts/guides/1'
  )
})

it('opens URLs manually by route name', () => {
  changePath('/')
  router = new SimpleRouter(client)
  openPage(router, 'post', { category: 'guides', id: '10' })

  expect(location.href).toEqual('http://localhost/posts/guides/10')
  expect(router.path).toEqual('/posts/guides/10')
  expect(router.page).toEqual({
    name: 'post',
    params: {
      category: 'guides',
      id: '10'
    }
  })
})

it('throws on openning RegExp router', () => {
  router = new SimpleRouter(client)
  expect(() => {
    expect(getPagePath(router, 'draft', { type: 'new', id: '1' })).toEqual('/')
  }).toThrow('RegExp routes are not supported')
})
