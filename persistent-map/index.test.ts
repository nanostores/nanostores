import { TestClient } from '@logux/client'

import { PersistentMap, emitter, destroy } from '../index.js'

let client = new TestClient('10')

it('throws on missed id', () => {
  class WrongStore extends PersistentMap {}
  expect(() => {
    new WrongStore(client)
  }).toThrow('Set WrongStore.id')
})

it('loads data from localStorage', () => {
  localStorage.setItem('a:one', '1')
  localStorage.setItem('a:two', '2')
  class A extends PersistentMap {
    static id = 'a'
    one?: string
    two?: string
  }

  let a = new A(client)
  expect(a.one).toEqual('1')
  expect(a.two).toEqual('2')
  a[destroy]()
})

it('emits events', () => {
  class B extends PersistentMap {
    static id = 'b'
    one?: string
    two?: string
  }

  let b = new B(client)
  let events: [string, string?][] = []
  b[emitter].on('change', (store, key) => {
    events.push([key, store[key]])
  })

  b.change('one', '1')
  b.change('two', '2')
  b.remove('one')

  expect(events).toEqual([
    ['one', '1'],
    ['two', '2'],
    ['one', undefined]
  ])
  expect(localStorage['b:two']).toEqual('2')
  b[destroy]()
})

it('listens for other tabs', () => {
  class C extends PersistentMap {
    static id = 'c'
    one?: string
    two?: string
  }

  let c = new C(client)
  let events: [string, string?][] = []
  c[emitter].on('change', (store, key) => {
    events.push([key, store[key]])
  })

  localStorage['c:one'] = '1'
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'c:one',
      newValue: '1'
    })
  )
  expect(events).toEqual([['one', '1']])
  expect(c.one).toEqual('1')

  c[destroy]()
  localStorage['c:one'] = '11'
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'c:one',
      newValue: '11'
    })
  )
})
