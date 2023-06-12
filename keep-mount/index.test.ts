import { test } from 'uvu'
import { equal } from 'uvu/assert'

import { atom, keepMount, onMount } from '../index.js'

test('adds empty listener', () => {
  let events: string[] = []
  let store = atom<undefined>()
  onMount(store, () => {
    events.push('init')
  })
  keepMount(store)
  equal(events, ['init'])
})

test.run()
