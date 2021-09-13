import VueTesting from '@testing-library/vue'
import Vue from 'vue'

import '../test/set-production.js'
import { createAtom } from '../index.js'
import { useStore } from './index.js'

let { defineComponent, isReadonly } = Vue
let { render } = VueTesting

it('does not return readonly state in production mode', () => {
  let store = createAtom(() => {})
  render(
    defineComponent(() => {
      let state = useStore(store, 'ID')
      expect(isReadonly(state)).toEqual(false)
      return () => null
    })
  )
})
