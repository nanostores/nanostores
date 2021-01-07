let { change, destroy } = require('../store')
let { LocalStore } = require('../local-store')

function createRouter (routes) {
  let normalizedRoutes = Object.keys(routes).map(name => {
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

  class Router extends LocalStore {
    constructor () {
      super()

      this.routes = normalizedRoutes

      this.click = event => {
        let link = event.target.closest('a')
        if (
          !event.defaultPrevented &&
          link &&
          event.button === 0 &&
          link.target !== '_blank' &&
          link.href.startsWith(location.origin) &&
          link.dataset.noRouter == null &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault()
          this.parse(link.href.slice(location.origin.length))
        }
      }

      this.popstate = () => {
        this.parse(location.pathname)
      }

      document.body.addEventListener('click', this.click)
      window.addEventListener('popstate', this.popstate)
      this.parse(location.pathname)
    }

    parse (path) {
      path = path.replace(/\/$/, '') || '/'
      if (this.path !== path) {
        this.path = path
        let page
        for (let [name, pattern, cb] of this.routes) {
          let match = path.match(pattern)
          if (match) {
            page = { name, params: cb(...match.slice(1)) }
            break
          }
        }
        this[change]('page', page)
      }
    }

    openUrl (path) {
      if (this.path !== path) {
        history.pushState(null, null, path)
        this.parse(path)
      }
    }

    [destroy] () {
      document.body.removeEventListener('click', this.click)
      window.removeEventListener('popstate', this.popstate)
    }
  }
  return Router
}

function getPagePath (router, name, params) {
  let route = router.routes.find(i => i[0] === name)
  if (!route[3]) throw new Error('RegExp routes are not supported')
  return route[3].replace(/\/:\w+/g, i => '/' + params[i.slice(2)])
}

function openPage (router, name, params) {
  router.openUrl(getPagePath(router, name, params))
}

module.exports = { createRouter, openPage, getPagePath }
