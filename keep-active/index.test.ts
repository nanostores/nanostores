import { keepActive, atom } from '../index.js'

it('adds empty listener', () => {
  let events: string[] = []
  let store = atom<undefined>(() => {
    events.push('init')
  })

  keepActive(store)
  expect(events).toEqual(['init'])
})
