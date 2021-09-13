import { keepActive, createAtom } from '../index.js'

it('adds empty listener', () => {
  let events: string[] = []
  let store = createAtom<undefined>(() => {
    events.push('init')
  })

  keepActive(store)
  expect(events).toEqual(['init'])
})
