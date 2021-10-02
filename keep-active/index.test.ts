import { keepActive, atom, mount } from '../index.js'

it('adds empty listener', () => {
  let events: string[] = []
  let store = atom<undefined>()
  mount(store, () => {
    events.push('init')
  })
  keepActive(store)
  expect(events).toEqual(['init'])
})
