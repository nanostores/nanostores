import {
  initLocalModel,
  LocalStore,
  LocalModel,
  Model,
  ObjectSpace
} from '../index.js'

let shared = {
  objects: new Map()
}

it('accepts only models', () => {
  class A extends LocalStore {
    static storeName = 'A'
  }
  expect(() => {
    // @ts-expect-error
    initLocalModel(shared, A, '1', () => {})
  }).toThrow(/A is store/)
})

it('accepts only local stores', () => {
  class A extends Model {
    static storeName = 'A'
  }
  expect(() => {
    initLocalModel(shared, A, '1', () => {})
  }).toThrow(/A should extends LocalModel class to be used in initLocalModel/)
})

it('creates store only once', () => {
  let own = { objects: new Map() }
  let calls: string[] = []
  class TestModel extends LocalModel {
    static storeName = 'test'

    constructor (objects: ObjectSpace, id: string) {
      super(objects, id)
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
  let unbind1 = initLocalModel(own, TestModel, 'test:1', store => {
    calls.push(`a:${store.id}`)
  })
  let unbind2 = initLocalModel(own, TestModel, 'test:1', store => {
    calls.push(`b:${store.id}`)
  })

  let store = own.objects.get('test:1')
  store.change()
  unbind1()

  store.change()
  unbind2()
  store.change()

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
  expect(own.objects.size).toEqual(0)
})

it('adds prefix', () => {
  let own = { objects: new Map() }
  class TestModel extends LocalModel {
    static storeName = 'test'
  }
  initLocalModel(own, TestModel, '1', store => {
    expect(store.id).toEqual('test:1')
  })
  expect(own.objects.get('test:1')).toBeDefined()
})
