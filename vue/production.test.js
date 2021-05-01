import { TestClient } from '@logux/client'
import VueTesting from '@testing-library/vue'
import Vue from 'vue'

import '../test/set-production.js'
import { loguxClient, useStore, ChannelErrors } from './index.js'
import { defineSyncMap } from '../sync/index.js'

let { render, screen } = VueTesting
let { defineComponent, h, nextTick } = Vue

let Store = defineSyncMap('test')

let IdTest = defineComponent(() => {
  let store = useStore(Store, 'ID')
  return () => h('div', store.value.isLoading ? 'loading' : store.value.id)
})

async function getText(component) {
  let client = new TestClient('10')
  render(
    defineComponent(() => () =>
      h('div', { 'data-testid': 'test' }, h(component))
    ),
    {
      global: {
        plugins: [[loguxClient, client]]
      }
    }
  )
  await nextTick()
  return screen.getByTestId('test').textContent
}

it('does not have ChannelErrors check in production mode', async () => {
  expect(
    await getText(
      defineComponent(() => () =>
        h(ChannelErrors, null, {
          default: () => h(IdTest)
        })
      )
    )
  ).toEqual('loading')
})
