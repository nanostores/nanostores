import { keepMount, atom, mount } from '../index.js'

it('adds empty listener', () => {
  let events: string[] = []
  let store = atom<undefined>()
  mount(store, () => {
    events.push('init')
  })
  keepMount(store)
  expect(events).toEqual(['init'])
})
