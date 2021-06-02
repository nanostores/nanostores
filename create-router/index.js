import { createStore } from '../create-store/index.js'

function bindRouterEvents(parse, setValue, element = document.body) {
  let click = event => {
    let link = event.target.closest('a')
    if (
      !event.defaultPrevented &&
      link &&
      event.button === 0 &&
      link.target !== '_blank' &&
      link.dataset.noRouter == null &&
      link.rel !== 'external' &&
      !link.download &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      let url = new URL(link.href)
      if (url.origin === location.origin) {
        event.preventDefault()
        let changed = location.hash !== url.hash
        navigate(url.href)
        if (changed) {
          location.hash = url.hash
          if (url.hash === '' || url.hash === '#') {
            window.dispatchEvent(new HashChangeEvent('hashchange'))
          }
        }
      }
    }
  }

  let navigate = (path, redirect) => {
    let page = parse(new URL(path, location.origin))
    if (page !== false) {
      history[redirect ? 'replaceState' : 'pushState'](null, null, path)
      setValue(page)
    }
  }

  let popstate = () => {
    let page = parse(new URL(location.href))
    if (page !== false) setValue(page)
  }

  return [
    () => {
      let page = parse(location)
      if (page !== false) setValue(page)
      element.addEventListener('click', click)
      window.addEventListener('popstate', popstate)
    },
    () => {
      element.removeEventListener('click', click)
      window.removeEventListener('popstate', popstate)
    },
    navigate
  ]
}

export function createRouter(routes) {
  let normalized = Object.keys(routes).map(name => {
    let value = routes[name]
    if (typeof value === 'string') {
      value = value.replace(/\/$/g, '') || '/'
      let names = (value.match(/\/:\w+/g) || []).map(i => i.slice(2))
      let pattern = value
        .replace(/[\s!#$()+,.:<=?[\\\]^{|}]/g, '\\$&')
        .replace(/\/\\:\w+/g, '/([^/]+)')
      return [
        name,
        RegExp('^' + pattern + '$', 'i'),
        (...matches) =>
          matches.reduce((params, match, index) => {
            params[names[index]] = match
            return params
          }, {}),
        value
      ]
    } else {
      return [name, ...value]
    }
  })

  let prev
  let parse = url => {
    let path = url.pathname
    path = path.replace(/\/$/, '') || '/'
    if (prev === path) return false
    prev = path

    for (let [route, pattern, cb] of normalized) {
      let match = path.match(pattern)
      if (match) {
        return { path, route, params: cb(...match.slice(1)) }
      }
    }
  }

  let router = createStore(() => {
    let [init, clean, navigate] = bindRouterEvents(parse, set)
    router.open = navigate
    router.routes = normalized

    init()
    return () => {
      prev = undefined
      clean()
    }
  })

  let set = router.set
  if (process.env.NODE_ENV !== 'production') {
    delete router.set
  }

  return router
}

export function getPagePath(router, name, params) {
  let route = router.routes.find(i => i[0] === name)
  if (process.env.NODE_ENV !== 'production') {
    if (!route[3]) throw new Error('RegExp routes are not supported')
  }
  return route[3].replace(/\/:\w+/g, i => '/' + params[i.slice(2)])
}

export function openPage(router, name, params) {
  router.open(getPagePath(router, name, params))
}

export function redirectPage(router, name, params) {
  router.open(getPagePath(router, name, params), true)
}
