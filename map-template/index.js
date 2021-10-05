import { onMount } from '../lifecycle/index.js'
import { clean } from '../clean-stores/index.js'
import { map } from '../map/index.js'

export function mapTemplate(init) {
  let Template = (id, ...args) => {
    if (!Template.cache[id]) {
      Template.cache[id] = Template.build(id, ...args)
    }
    return Template.cache[id]
  }

  Template.build = (id, ...args) => {
    let store = map()
    let clear = onMount(store, () => {
      store.setKey('id', id)
      let destroy
      if (init) destroy = init(store, id, ...args)
      return () => {
        delete Template.cache[id]
        if (destroy) destroy()
        clear()
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
