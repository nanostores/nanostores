import { test } from 'uvu'
import { equal, is, throws } from 'uvu/assert'

import {
  atom,
  clean,
  cleanStores,
  map,
  type MapCreator,
  type MapStore,
  onMount
} from '../index.js'

test.before.each(() => {
  process.env.NODE_ENV = 'test'
})

function getCache(model: any): string[] {
  return Object.keys(model.cache)
}

function privateMethods(obj: any): any {
  return obj
}

export function mapTemplate(
  init?: (store: MapStore, id: string) => (() => void) | undefined
): MapCreator {
  let Template: any = (id: string) => {
    if (!Template.cache[id]) {
      Template.cache[id] = Template.build(id)
    }
    return Template.cache[id]
  }

  Template.build = (id: string) => {
    let store = map({ id })
    onMount(store, () => {
      let destroy: (() => void) | undefined
      if (init) destroy = init(store, id)
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

test('cleans stores', () => {
  let events: string[] = []

  let loaded = atom()

  onMount(loaded, () => {
    events.push('loaded')
    return () => {
      events.push('unloaded')
    }
  })

  loaded.listen(() => {})

  let noDestroy = atom()

  onMount(noDestroy, () => {})

  noDestroy.listen(() => {})

  let noLoaded = atom()

  onMount(noLoaded, () => {})

  let Model = mapTemplate((store, id) => {
    return () => {
      events.push(`built ${id}`)
    }
  })
  Model('1').listen(() => {})
  Model('2').listen(() => {})

  let NoDestroyModel = mapTemplate()
  NoDestroyModel('1').listen(() => {})
  NoDestroyModel('2').listen(() => {})

  let NotLoadedModel = mapTemplate()
  NotLoadedModel('1')
  NotLoadedModel('2')

  cleanStores(
    loaded,
    noDestroy,
    noLoaded,
    Model,
    NoDestroyModel,
    NotLoadedModel
  )

  equal(events, ['loaded', 'unloaded', 'built 1', 'built 2'])
  equal(getCache(Model), [])
  equal(getCache(NoDestroyModel), [])
  equal(getCache(NotLoadedModel), [])

  loaded.listen(() => {})
  equal(events, ['loaded', 'unloaded', 'built 1', 'built 2', 'loaded'])
})

test('allows to call multiple times', () => {
  let events: string[] = []

  let loaded = atom()

  onMount(loaded, () => {
    return () => {
      events.push('loaded')
    }
  })

  loaded.listen(() => {})

  let Model = mapTemplate((store, id) => {
    return () => {
      events.push(`built ${id}`)
    }
  })
  Model('1').listen(() => {})
  Model('2').listen(() => {})

  cleanStores(loaded, Model)
  cleanStores(loaded, Model)

  equal(events, ['loaded', 'built 1', 'built 2'])
})

test('throws in production', () => {
  process.env.NODE_ENV = 'production'
  throws(() => {
    cleanStores()
  }, /only during development or tests/)
})

test('cleans mocks', () => {
  let Model = mapTemplate()
  Model('1').listen(() => {})
  privateMethods(Model).mocked = true

  cleanStores(Model)

  is(privateMethods(Model).mocked, undefined)
})

test('ignores undefined stores', () => {
  cleanStores(undefined)
})

test('cleans stores without events', () => {
  let store = atom('')
  store.listen(() => {})
  cleanStores(store)

  let events: string[] = []
  onMount(store, () => {
    events.push('loaded')
  })
  store.listen(() => {})
  equal(events, ['loaded'])
})

test.run()
