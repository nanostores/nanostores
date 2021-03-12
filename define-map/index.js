import { createMap } from '../create-map/index.js'
import { clean } from '../clean-stores/index.js'

export function defineMap(init) {
  let Builder = (id, ...args) => {
    if (!Builder.cache[id]) {
      let store = createMap(() => {
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
