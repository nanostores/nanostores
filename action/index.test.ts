import {
  onNotify,
  atom,
  action,
  lastAction,
  mapTemplate,
  actionFor
} from '../index.js'

it('shows action name', () => {
  let events: (string | undefined)[] = []
  let store = atom(1)
  onNotify(store, () => {
    events.push(store[lastAction])
  })

  let setProp = action(store, 'setProp', (num: number) => {
    store.set(num)
  })

  setProp(1)
  setProp(2)
  setProp(3)
  expect(events).toEqual(['setProp', 'setProp', 'setProp'])
})

it('supports map templates', () => {
  let Counter = mapTemplate<{ value: number }>(store => {
    store.setKey('value', 0)
  })
  let add = actionFor(Counter, 'add', (store, number: number = 1) => {
    store.setKey('value', store.get().value + number)
  })

  let events: (string | undefined)[] = []
  let store = Counter('id')
  store.listen(() => {})
  onNotify(store, () => {
    events.push(store[lastAction])
  })

  add(store)
  add(store, 2)
  expect(events).toEqual(['add', 'add'])
  expect(store.get()).toEqual({ id: 'id', value: 3 })
})
