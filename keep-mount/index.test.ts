import { deepStrictEqual } from 'node:assert'
import { test } from 'node:test'

import { atom, keepMount, onMount } from '../index.js'

test('adds empty listener', () => {
  let events: string[] = []
  let store = atom<undefined>()
  onMount(store, () => {
    events.push('init')
  })
  keepMount(store)
  deepStrictEqual(events, ['init'])
})
