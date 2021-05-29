import { keepActive, createStore } from '../index.js'

it('adds empty listener', () => {
  let events: string[] = []
  let store = createStore<undefined>(() => {
    events.push('init')
  })

  keepActive(store)
  expect(events).toEqual(['init'])
})
