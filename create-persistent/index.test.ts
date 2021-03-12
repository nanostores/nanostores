import { createPersistent, cleanStores, MapStore, getValue } from '../index.js'

let store: MapStore<{ one?: string; two?: string }>
afterEach(() => {
  cleanStores(store)
  localStorage.clear()
})

function clone(data: object): object {
  return JSON.parse(JSON.stringify(data))
}

it('loads data from localStorage', () => {
  localStorage.setItem('a:one', '1')
  store = createPersistent<{ one?: string; two?: string }>({ two: '2' }, 'a:')
  expect(getValue(store)).toEqual({ one: '1', two: '2' })
})

it('saves to localStorage', () => {
  store = createPersistent({}, 'b:')

  let events: object[] = []
  store.listen(value => {
    events.push(clone(value))
  })

  store.setKey('one', '1')
  store.setKey('two', '2')
  expect(localStorage.__STORE__).toEqual({ 'b:one': '1', 'b:two': '2' })
  expect(events).toEqual([{ one: '1' }, { one: '1', two: '2' }])

  store.set({ one: '11' })
  expect(localStorage.__STORE__).toEqual({ 'b:one': '11' })
  expect(events).toEqual([
    { one: '1' },
    { one: '1', two: '2' },
    { one: '11', two: '2' },
    { one: '11' }
  ])

  store.setKey('one', undefined)
  expect(localStorage.__STORE__).toEqual({})
  expect(events).toEqual([
    { one: '1' },
    { one: '1', two: '2' },
    { one: '11', two: '2' },
    { one: '11' },
    {}
  ])
})

it('listens for other tabs', () => {
  store = createPersistent({}, 'c:')

  let events: object[] = []
  store.listen(value => {
    events.push(clone(value))
  })

  localStorage['c:one'] = '1'
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'c:one',
      newValue: '1'
    })
  )

  expect(events).toEqual([{ one: '1' }])
  expect(getValue(store)).toEqual({ one: '1' })
})

it('saves to localStorage in disabled state', () => {
  store = createPersistent({}, 'd:')

  store.setKey('one', '1')
  expect(localStorage['d:one']).toEqual('1')

  store.setKey('one', undefined)
  expect(localStorage['d:one']).toBeUndefined()
})
