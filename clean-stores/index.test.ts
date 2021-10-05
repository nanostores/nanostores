import { cleanStores, atom, mapTemplate, onMount } from '../index.js'

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

  let loaded = atom()

  onMount(loaded, () => {
    return () => {
      events.push('loaded')
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

  expect(events).toEqual(['loaded', 'built 1', 'built 2'])
  expect(getCache(Model)).toHaveLength(0)
  expect(getCache(NoDestroyModel)).toHaveLength(0)
  expect(getCache(NotLoadedModel)).toHaveLength(0)
})

it('allows to call multiple times', () => {
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

  expect(events).toEqual(['loaded', 'built 1', 'built 2'])
})

it('throws in production', () => {
  process.env.NODE_ENV = 'production'
  expect(() => {
    cleanStores()
  }).toThrow(/only during development or tests/)
})

it('cleans mocks', () => {
  let Model = mapTemplate()
  Model('1').listen(() => {})
  privateMethods(Model).mocked = true

  cleanStores(Model)

  expect(privateMethods(Model).mocked).toBeUndefined()
})

it('ignores undefined stores', () => {
  cleanStores(undefined)
})
