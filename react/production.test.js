import { TestClient } from '@logux/client'
import ReactTesting from '@testing-library/react'
import React from 'react'

import '../test/set-production.js'
import { useRemoteStore, ClientContext, ChannelErrors } from './index.js'
import { RemoteStore } from '../index.js'

let { render, screen } = ReactTesting
let h = React.createElement

class SimpleRemoteState extends RemoteStore {
  constructor (id) {
    super(id)
    this.storeLoading = Promise.resolve()
  }
}

let IdTest = ({ Store }) => {
  let store = useRemoteStore(Store, 'ID')
  return h('div', {}, store.isLoading ? 'loading' : store.id)
}

function getText (component) {
  let client = new TestClient('10')
  render(
    h(
      ClientContext.Provider,
      { value: client },
      h('div', { 'data-testid': 'test' }, component)
    )
  )
  return screen.getByTestId('test').textContent
}

it('does not have ChannelErrors check in production mode', async () => {
  expect(
    getText(h(ChannelErrors, {}, h(IdTest, { Store: SimpleRemoteState })))
  ).toEqual('ID')
})
