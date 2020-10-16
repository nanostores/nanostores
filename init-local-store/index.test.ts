import {
  initLocalStore,
  LocalStore,
  LocalModel,
  Store,
  ObjectSpace
} from '../index.js'

let shared = {
  objects: new Map()
}

it('checks store name', () => {
  class NoName extends LocalStore {}
  expect(() => {
    initLocalStore(shared, NoName, () => {})
  }).toThrow(/static storeName/)
})

it('avoid models', () => {
  class A extends LocalModel {
    static storeName = 'A'
  }
  expect(() => {
    // @ts-expect-error
    initLocalStore(shared, A, () => {})
  }).toThrow(/A is model/)
})

it('accepts only local stores', () => {
  class A extends Store {
    static storeName = 'A'
  }
  expect(() => {
    initLocalStore(shared, A, () => {})
  }).toThrow(/A should extends LocalStore class to be used in initLocalStore/)
})

it('creates store only once', () => {
  let own = { objects: new Map() }
  let calls: string[] = []
  class TestStore extends LocalStore {
    static storeName = 'test'

    test = 1

    constructor (objects: ObjectSpace) {
      super(objects)
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
  let unbind1 = initLocalStore(own, TestStore, store => {
    expect(store.test).toEqual(1)
    calls.push('a')
  })
  let unbind2 = initLocalStore(own, TestStore, () => {
    calls.push('b')
  })

  let store = own.objects.get(TestStore)
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
  expect(own.objects.size).toEqual(0)
})
