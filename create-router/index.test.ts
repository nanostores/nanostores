import { delay } from 'nanodelay'

import {
  createRouter,
  cleanStores,
  getPagePath,
  CurrentPage,
  openPage,
  Router
} from '../index.js'

function addListener () {
  let events: (CurrentPage | undefined)[] = []
  SimpleRouter.load().addListener((store: Router) => {
    events.push(store.page)
  })
  return events
}

function changePath (path: string) {
  window.history.pushState(null, '', path)
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

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(async () => {
  await cleanStores(SimpleRouter)
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild)
  }
})

it('parses current location', () => {
  changePath('/posts/guides/10')
  expect(SimpleRouter.load().path).toEqual('/posts/guides/10')
  expect(SimpleRouter.load().page).toEqual({
    name: 'post',
    params: {
      category: 'guides',
      id: '10'
    }
  })
})

it('ignores last slash', () => {
  changePath('/posts/guides/10/')
  expect(SimpleRouter.load().path).toEqual('/posts/guides/10')
  expect(SimpleRouter.load().page).toEqual({
    name: 'post',
    params: {
      category: 'guides',
      id: '10'
    }
  })
})

it('processes 404', () => {
  changePath('/posts/guides')
  expect(SimpleRouter.load().path).toEqual('/posts/guides')
  expect(SimpleRouter.load().page).toBeUndefined()
})

it('escapes RegExp symbols in routes', () => {
  changePath('/[secret]/9')
  expect(SimpleRouter.load().page).toEqual({
    name: 'secret',
    params: {
      id: '9'
    }
  })
})

it('ignores hash and search', () => {
  changePath('/posts/?id=1#top')
  expect(SimpleRouter.load().path).toEqual('/posts')
  expect(SimpleRouter.load().page).toEqual({ name: 'posts', params: {} })
})

it('ignores case', () => {
  changePath('/POSTS')
  expect(SimpleRouter.load().path).toEqual('/POSTS')
  expect(SimpleRouter.load().page).toEqual({ name: 'posts', params: {} })
})

it('detects URL changes', async () => {
  changePath('/posts/guides/10/')
  let events = addListener()

  changePath('/')
  window.dispatchEvent(new PopStateEvent('popstate'))

  expect(SimpleRouter.load().path).toEqual('/')
  expect(SimpleRouter.load().page).toEqual({ name: 'home', params: {} })

  await delay(1)
  expect(events).toEqual([{ name: 'home', params: {} }])
})

it('unbinds events', () => {
  changePath('/posts/guides/10/')
  let events = addListener()
  SimpleRouter.loaded?.destroy()

  changePath('/')
  window.dispatchEvent(new PopStateEvent('popstate'))

  expect(events).toEqual([])
})

it('ignores the same URL in popstate', () => {
  changePath('/posts/guides/10/')
  let events = addListener()

  changePath('/posts/guides/10/')
  window.dispatchEvent(new PopStateEvent('popstate'))

  expect(events).toEqual([])
})

it('detects clicks', async () => {
  changePath('/')
  let events = addListener()

  let link = createTag(document.body, 'a', { href: '/posts' })
  link.click()

  expect(SimpleRouter.load().path).toEqual('/posts')
  expect(SimpleRouter.load().page).toEqual({ name: 'posts', params: {} })

  await delay(1)
  expect(events).toEqual([{ name: 'posts', params: {} }])
})

it('accepts click on tag inside link', () => {
  changePath('/')
  let router = SimpleRouter.load()

  let link = createTag(document.body, 'a', { href: '/posts' })
  let span = createTag(link, 'span')
  span.click()

  expect(router.path).toEqual('/posts')
})

it('ignore non-link clicks', () => {
  changePath('/')
  let router = SimpleRouter.load()

  let span = createTag(document.body, 'span', { href: '/posts' })
  span.click()

  expect(router.path).toEqual('/')
})

it('ignores special clicks', () => {
  changePath('/')
  let router = SimpleRouter.load()

  let link = createTag(document.body, 'a', { href: '/posts' })
  let event = new MouseEvent('click', { bubbles: true, ctrlKey: true })
  link.dispatchEvent(event)

  expect(router.path).toEqual('/')
})

it('ignores other mouse button click', () => {
  changePath('/')
  let router = SimpleRouter.load()

  let link = createTag(document.body, 'a', { href: '/posts' })
  let event = new MouseEvent('click', { bubbles: true, button: 2 })
  link.dispatchEvent(event)

  expect(router.path).toEqual('/')
})

it('ignores prevented events', () => {
  changePath('/')
  let router = SimpleRouter.load()

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
  let router = SimpleRouter.load()

  let link = createTag(document.body, 'a', { href: '/posts', target: '_blank' })
  link.click()

  expect(router.path).toEqual('/')
})

it('ignores external links', () => {
  changePath('/')
  let router = SimpleRouter.load()
  let events = addListener()

  let link = createTag(document.body, 'a', { href: 'http://lacalhast/posts' })
  link.click()

  expect(router.path).toEqual('/')
  expect(events).toHaveLength(0)
})

it('ignores the same URL in link', () => {
  changePath('/posts')
  SimpleRouter.load()
  let events = addListener()

  let link = createTag(document.body, 'a', { href: '/posts' })
  link.click()

  expect(events).toHaveLength(0)
})

it('respects data-ignore-router', () => {
  changePath('/')
  let router = SimpleRouter.load()

  let link = createTag(document.body, 'a', { href: '/posts' })
  link.setAttribute('data-no-router', '1')
  link.click()

  expect(router.path).toEqual('/')
})

it('opens URLs manually', async () => {
  changePath('/posts/guides/10/')
  let router = SimpleRouter.load()
  let events = addListener()

  router.openUrl('/posts/')
  expect(location.href).toEqual('http://localhost/posts/')
  expect(router.path).toEqual('/posts')
  expect(router.page).toEqual({ name: 'posts', params: {} })

  await delay(1)
  expect(events).toEqual([{ name: 'posts', params: {} }])
})

it('ignores the same URL in manuall URL', () => {
  changePath('/posts/guides/10')
  let router = SimpleRouter.load()
  let events = addListener()

  router.openUrl('/posts/guides/10')
  expect(events).toEqual([])
})

it('allows RegExp routes', () => {
  changePath('/posts/draft/10/')
  expect(SimpleRouter.load().page).toEqual({
    name: 'draft',
    params: { type: 'draft', id: '10' }
  })
})

it('generates URLs', () => {
  let router = SimpleRouter.load()
  expect(getPagePath(router, 'home')).toEqual('/')
  expect(getPagePath(router, 'posts')).toEqual('/posts')
  expect(getPagePath(router, 'post', { category: 'guides', id: '1' })).toEqual(
    '/posts/guides/1'
  )
})

it('opens URLs manually by route name', () => {
  changePath('/')
  let router = SimpleRouter.load()
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
  let router = SimpleRouter.load()
  expect(() => {
    expect(getPagePath(router, 'draft', { type: 'new', id: '1' })).toEqual('/')
  }).toThrow('RegExp routes are not supported')
})
