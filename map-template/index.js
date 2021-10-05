import { onMount } from '../lifecycle/index.js'
import { clean } from '../clean-stores/index.js'
import { map } from '../map/index.js'

export function mapTemplate(init) {
  let Builder = (id, ...args) => {
    if (!Builder.cache[id]) {
      Builder.cache[id] = Builder.build(id, ...args)
    }
    return Builder.cache[id]
  }

  Builder.build = (id, ...args) => {
    let store = map()
    let clear = onMount(store, () => {
      store.setKey('id', id)
      let destroy
      if (init) destroy = init(store, id, ...args)
      return () => {
        delete Builder.cache[id]
        if (destroy) destroy()
        clear()
      }
    })
    return store
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
