import { Client } from '@logux/client'

import { Store, Model, subscribe } from '../index.js'

function buildClient (): Client {
  return { objects: new Map() } as any
}

it('throws an error on model without ID', () => {
  class AModel extends Model {}
  expect(() => {
    // @ts-expect-error
    subscribe(buildClient(), AModel, () => {})
  }).toThrow(/AModel requires model ID to be loaded/)
})

it('throws an error on non-model without ID', () => {
  class AStore extends Store {}
  expect(() => {
    // @ts-expect-error
    subscribe(buildClient(), AStore, '10', () => {})
  }).toThrow(/AStore doesn’t use model ID/)
})

it('creates store only once', () => {
  let client = buildClient()
  let calls: string[] = []
  class TestStore extends Store {
    test = 1

    constructor (c: Client) {
      super(c)
      calls.push('constructor')
    }

    destroy () {
      calls.push('destroy')
    }

    change () {
      calls.push('change')
      this.emitter.emit('change', this)
    }
  }
  let unbind1 = subscribe(client, TestStore, store => {
    expect(store.test).toEqual(1)
    calls.push('a')
  })
  let unbind2 = subscribe(client, TestStore, () => {
    calls.push('b')
  })

  let store = client.objects.get(TestStore) as TestStore
  store.change()
  unbind1()

  store.change()
  unbind2()
  store.change()

  expect(calls).toEqual([
    'constructor',
    'a',
    'b',
    'change',
    'a',
    'b',
    'change',
    'b',
    'destroy',
    'change'
  ])
  expect(client.objects.size).toEqual(0)
})

it('creates model only once', () => {
  let client = buildClient()
  let calls: string[] = []
  class TestModel extends Model {
    test = 1

    constructor (c: Client, id: string) {
      super(c, id)
      calls.push('constructor')
    }

    destroy () {
      calls.push('destroy')
    }

    change () {
      calls.push('change')
      this.emitter.emit('change', this)
    }
  }

  let unbind1 = subscribe(client, TestModel, 'test:1', model => {
    calls.push(`a:${model.id}`)
  })
  let unbind2 = subscribe(client, TestModel, 'test:1', model => {
    calls.push(`b:${model.id}`)
  })

  let store = client.objects.get('test:1') as TestModel
  store.change()
  unbind1()

  store.change()
  expect(client.objects.has('test:1')).toBe(true)
  unbind2()
  store.change()
  expect(client.objects.has('test:1')).toBe(false)

  expect(calls).toEqual([
    'constructor',
    'a:test:1',
    'b:test:1',
    'change',
    'a:test:1',
    'b:test:1',
    'change',
    'b:test:1',
    'destroy',
    'change'
  ])
  expect(client.objects.size).toEqual(0)
})
