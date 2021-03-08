import { TestClient } from '@logux/client'

import {
  defineSyncMap,
  createFilter,
  cleanStores,
  createStore,
  defineMap
} from '../index.js'

let prevEnv = process.env.NODE_ENV
afterEach(() => {
  process.env.NODE_ENV = prevEnv
})

function getCache (model: any): string[] {
  return Object.keys(model.cache)
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

it('clean filters', () => {
  let client = new TestClient('10')
  client.log.keepActions()
  let Post = defineSyncMap<{
    title: string
    projectId: string
  }>('posts')

  let filter1a = createFilter(client, Post, { projectId: '1' })
  let filter2a = createFilter(client, Post, { projectId: '2' })
  filter2a.listen(() => {})

  cleanStores(Post)

  let filter1b = createFilter(client, Post, { projectId: '1' })
  let filter2b = createFilter(client, Post, { projectId: '2' })
  filter2b.listen(() => {})
  expect(filter1a).not.toBe(filter1b)
  expect(filter2a).not.toBe(filter2b)

  expect(client.log.actions()).toHaveLength(3)
})
