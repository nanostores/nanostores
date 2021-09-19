import { map } from '../map/index.js'
import { clean } from '../clean-stores/index.js'
import { mount } from '../index.js'

export function mapTemplate(init) {
  let Builder = (id, ...args) => {
    if (!Builder.cache[id]) {
      let store = map()
      mount(store, () => {
        store.setKey('id', id)
        let destroy
        if (init) destroy = init(store, id, ...args)
        return () => {
          delete Builder.cache[id]
          if (destroy) destroy()
        }
      })
      Builder.cache[id] = store
    }
    return Builder.cache[id]
  }

  Builder.cache = {}

  if (process.env.NODE_ENV !== 'production') {
    Builder[clean] = () => {
      for (let id in Builder.cache) {
        Builder.cache[id][clean]()
      }
      Builder.cache = {}
    }
  }

  return Builder
}
