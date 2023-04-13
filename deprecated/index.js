import { onMount, on } from '../lifecycle/index.js'
import { doAction } from '../action/index.js'
import { clean } from '../clean-stores/index.js'
import { map } from '../map/index.js'

function warn(text) {
  if (typeof console !== 'undefined' && console.warn) {
    console.groupCollapsed('Nano Stores: ' + text)
    console.trace('Source of deprecated call')
    console.groupEnd()
  }
}

export function mapTemplate(init) {
  warn('Replace mapTemplate() to function with map() call inside and own cache')

  let Template = (id, ...args) => {
    if (!Template.cache[id]) {
      Template.cache[id] = Template.build(id, ...args)
    }
    return Template.cache[id]
  }

  Template.build = (id, ...args) => {
    let store = map({ id })
    onMount(store, () => {
      let destroy
      if (init) destroy = init(store, id, ...args)
      return () => {
        delete Template.cache[id]
        if (destroy) destroy()
      }
    })
    return store
  }

  Template.cache = {}

  if (process.env.NODE_ENV !== 'production') {
    Template[clean] = () => {
      for (let id in Template.cache) {
        Template.cache[id][clean]()
      }
      Template.cache = {}
    }
  }

  return Template
}

const BUILD = 4

export let onBuild = (Template, listener) =>
  on(Template, listener, BUILD, runListeners => {
    let originBuild = Template.build
    Template.build = (...args) => {
      let store = originBuild(...args)
      runListeners({ store })
      return store
    }
    return () => {
      Template.build = originBuild
    }
  })

export let actionFor = (Template, actionName, cb) => {
  return (store, ...rest) => doAction(store, actionName, cb, rest)
}
