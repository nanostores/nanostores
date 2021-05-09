import { cleanStores, createStore, defineMap } from '../index.js'

let prevEnv = process.env.NODE_ENV
afterEach(() => {
  process.env.NODE_ENV = prevEnv
})

function getCache(model: any): string[] {
  return Object.keys(model.cache)
}

function privateMethods(obj: any): any {
  return obj
}

it('cleans stores', () => {
  let events: string[] = []

  let loaded = createStore(() => {
    return () => {
      events.push('loaded')
    }
  })
  loaded.listen(() => {})

  let noDestroy = createStore()
  noDestroy.listen(() => {})

  let noLoaded = createStore()

  let Model = defineMap((store, id) => {
    return () => {
      events.push(`built ${id}`)
    }
  })
  Model('1').listen(() => {})
  Model('2').listen(() => {})

  let NoDestroyModel = defineMap()
  NoDestroyModel('1').listen(() => {})
  NoDestroyModel('2').listen(() => {})

  let NotLoadedModel = defineMap()
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

  expect(events).toEqual(['loaded', 'built 1', 'built 2'])
  expect(getCache(Model)).toHaveLength(0)
  expect(getCache(NoDestroyModel)).toHaveLength(0)
  expect(getCache(NotLoadedModel)).toHaveLength(0)
})

it('allows to call multiple times', () => {
  let events: string[] = []

  let loaded = createStore(() => {
    return () => {
      events.push('loaded')
    }
  })
  loaded.listen(() => {})

  let Model = defineMap((store, id) => {
    return () => {
      events.push(`built ${id}`)
    }
  })
  Model('1').listen(() => {})
  Model('2').listen(() => {})

  cleanStores(loaded, Model)
  cleanStores(loaded, Model)

  expect(events).toEqual(['loaded', 'built 1', 'built 2'])
})

it('throws in production', () => {
  process.env.NODE_ENV = 'production'
  expect(() => {
    cleanStores()
  }).toThrow(/only during development or tests/)
})

it('cleans mocks', () => {
  let Model = defineMap()
  Model('1').listen(() => {})
  privateMethods(Model).mocked = true

  cleanStores(Model)

  expect(privateMethods(Model).mocked).toBeUndefined()
})
