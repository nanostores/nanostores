import '@testing-library/jest-dom/extend-expect'
import { createElement as h, FC, useState } from 'react'
import { render, screen, act, getElementError } from '@testing-library/react'
import { Client } from '@logux/client'

import { useStore, ClientContext } from './index.js'
import { Store, Model } from '../index.js'

function buildClient (): Client {
  return { objects: new Map() } as any
}

class TestStore extends Store {
  value: string = 'a'

  changeValue (value: string) {
    this.value = value
    this.emitter.emit('change', this)
  }
}

it('throws on missed context', () => {
  let error: Error | undefined
  let Component: FC = () => {
    error = undefined
    try {
      // @ts-expect-error
      useStore(TestStore, '10')
    } catch (e) {
      error = e
    }
    return null
  }

  render(h(Component))
  expect(error?.message).toContain('ClientContext.Provider')

  let client = buildClient()
  render(h(ClientContext.Provider, { value: client }, h(Component)))
  expect(error?.message).toEqual('TestStore doesn’t use model ID')
})

it('renders and update store', () => {
  let client = buildClient()
  let renders = 0

  let Component: FC = () => {
    renders += 1
    let test = useStore(TestStore)
    return h('div', { 'data-testid': 'test' }, test.value)
  }

  let Wrapper: FC = () => {
    let [show, setShow] = useState<boolean>(true)
    return h(
      'div',
      {},
      h('button', { onClick: () => setShow(false) }),
      show && h(Component)
    )
  }

  render(h(ClientContext.Provider, { value: client }, h(Wrapper)))
  expect(screen.getByTestId('test')).toHaveTextContent('a')
  expect(renders).toEqual(1)

  let store = client.objects.get(TestStore) as TestStore
  act(() => {
    store.changeValue('b')
  })

  expect(screen.getByTestId('test')).toHaveTextContent('b')
  expect(renders).toEqual(2)

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(renders).toEqual(2)
  expect(client.objects.has(TestStore)).toBe(false)
})

it('renders and update models', () => {
  let destroyed = 0
  class TestModel extends Model {
    destroy () {
      destroyed += 1
    }
  }

  let client = buildClient()
  let renders = 0

  let Component: FC<{ id: string }> = ({ id }) => {
    renders += 1
    let test = useStore(TestModel, id)
    return h('div', { 'data-testid': 'test' }, test.id)
  }

  let Wrapper: FC = () => {
    let [number, inc] = useState<number>(1)
    return h(
      'div',
      {},
      h('button', { onClick: () => inc(2) }),
      h(Component, { id: `test:${number}` })
    )
  }

  render(h(ClientContext.Provider, { value: client }, h(Wrapper)))
  expect(screen.getByTestId('test')).toHaveTextContent('test:1')
  expect(renders).toEqual(1)

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.getByTestId('test')).toHaveTextContent('test:2')
  expect(renders).toEqual(2)
  expect(client.objects.has('test:1')).toBe(false)
  expect(client.objects.has('test:2')).toBe(true)
  expect(destroyed).toEqual(1)
})
