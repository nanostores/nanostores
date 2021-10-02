import { keepMount, atom, onMount } from '../index.js'

it('adds empty listener', () => {
  let events: string[] = []
  let store = atom<undefined>()
  onMount(store, () => {
    events.push('init')
  })
  keepMount(store)
  expect(events).toEqual(['init'])
})
