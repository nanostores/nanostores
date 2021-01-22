let { TestClient } = require('@logux/client')
let { createElement: h } = require('react')
let { render, screen } = require('@testing-library/react')

process.env.NODE_ENV = 'production'

let { useRemoteStore, ClientContext, ChannelErrors } = require('./index.js')
let { RemoteStore } = require('../index.js')

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
