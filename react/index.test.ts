import '@testing-library/jest-dom/extend-expect'
import {
  TestClient,
  Client,
  ChannelNotFoundError,
  ChannelDeniedError,
  ChannelServerError,
  LoguxUndoError
} from '@logux/client'
import { createElement as h, FC, useState, Component } from 'react'
import { render, screen, act } from '@testing-library/react'
import { delay } from 'nanodelay'

import {
  LocalStore,
  RemoteStore,
  loading,
  loaded,
  emitter,
  destroy
} from '../index.js'
import {
  useLocalStore,
  useRemoteStore,
  ClientContext,
  ChannelErrors
} from './index.js'

function getCather (cb: () => void): [string[], FC] {
  let errors: string[] = []
  let Catcher: FC = () => {
    try {
      cb()
    } catch (e) {
      errors.push(e.message)
    }
    return null
  }
  return [errors, Catcher]
}

async function catchLoadingError (error: Error) {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  let rejectLoading: (e: Error) => void = () => {}
  class BrokenStore extends RemoteStore {
    [loaded] = false;
    [loading] = new Promise<void>((resolve, reject) => {
      rejectLoading = reject
    })
  }
  class ErrorCatcher extends Component {
    state: { message?: string } = {}

    static getDerivedStateFromError (e: Error) {
      return { message: e.message }
    }

    render () {
      if (typeof this.state.message === 'string') {
        return h('div', {}, this.state.message)
      } else {
        return this.props.children
      }
    }
  }
  let Test: FC = () => {
    let [isLoading, store] = useRemoteStore(BrokenStore, 'ID')
    return h('div', {}, isLoading ? 'loading' : store.id)
  }
  let Bad: FC = () => h('div', 'bad')
  let NotFound: FC<{ error: ChannelNotFoundError }> = props => {
    return h('div', {}, `404 ${props.error.action.reason}`)
  }
  let AccessDenied: FC<{ error: ChannelDeniedError }> = props => {
    return h('div', {}, `403 ${props.error.action.reason}`)
  }
  let ServerError: FC<{ error: ChannelServerError }> = props => {
    return h('div', {}, `500 ${props.error.action.reason}`)
  }
  let client = new TestClient('10')
  render(
    h(
      ClientContext.Provider,
      { value: client },
      h(
        'div',
        { 'data-testid': 'test' },
        h(
          ErrorCatcher,
          {},
          h(
            ChannelErrors,
            { AccessDenied, NotFound: Bad, ServerError },
            h(ChannelErrors, { NotFound }, h(ChannelErrors, {}, h(Test)))
          )
        )
      )
    )
  )
  expect(screen.getByTestId('test')).toHaveTextContent('loading')

  await act(async () => {
    rejectLoading(error)
    await delay(1)
  })
  return screen.getByTestId('test').textContent
}

class SimpleLocalStore extends LocalStore {}

class SimpleRemoteStore extends RemoteStore {
  [loaded] = true;
  [loading] = Promise.resolve()
}

it('throws on missed context for local store', () => {
  let [errors, Catcher] = getCather(() => {
    useLocalStore(SimpleLocalStore)
  })
  render(h(Catcher))
  expect(errors).toEqual([
    'Wrap the component in Logux <ClientContext.Provider>'
  ])
})

it('throws on locale store in useRemoteStore', () => {
  let [errors, Catcher] = getCather(() => {
    // @ts-expect-error
    useRemoteStore(SimpleLocalStore, '10')
  })
  let client = new TestClient('10')
  render(h(ClientContext.Provider, { value: client }, h(Catcher)))
  expect(errors).toEqual([
    'SimpleLocalStore is a local store and need to be created ' +
      'with useLocalStore()'
  ])
})

it('throws on missed context for remote store', () => {
  let [errors, Catcher] = getCather(() => {
    useRemoteStore(SimpleRemoteStore, '10')
  })
  render(h(Catcher))
  expect(errors).toEqual([
    'Wrap the component in Logux <ClientContext.Provider>'
  ])
})

it('throws on remote store in useLocalStore', () => {
  let [errors, Catcher] = getCather(() => {
    // @ts-expect-error
    useLocalStore(SimpleRemoteStore)
  })
  let client = new TestClient('10')
  render(h(ClientContext.Provider, { value: client }, h(Catcher)))
  expect(errors).toEqual([
    'SimpleRemoteStore is a remote store and need to be load ' +
      'with useRemoteStore()'
  ])
})

it('renders local store', async () => {
  let client = new TestClient('10')
  let events: string[] = []
  let renders = 0

  class TestStore extends LocalStore {
    value = 'a'

    constructor (c: Client) {
      super(c)
      events.push('constructor')
    }

    change (value: string) {
      this.value = value
      events.push('change')
      this[emitter].emit('change', this)
    }

    [destroy] () {
      events.push('destroy')
    }
  }

  let Test1: FC = () => {
    renders += 1
    let test = useLocalStore(TestStore)
    return h('div', { 'data-testid': 'test1' }, test.value)
  }

  let Test2: FC = () => {
    let test = useLocalStore(TestStore)
    return h('div', { 'data-testid': 'test2' }, test.value)
  }

  let Wrapper: FC = () => {
    let [show, setShow] = useState<boolean>(true)
    return h(
      'div',
      {},
      h('button', { onClick: () => setShow(false) }),
      show && h(Test1),
      show && h(Test2)
    )
  }

  render(h(ClientContext.Provider, { value: client }, h(Wrapper)))
  expect(screen.getByTestId('test1')).toHaveTextContent('a')
  expect(screen.getByTestId('test2')).toHaveTextContent('a')
  expect(renders).toEqual(1)

  let store = client.objects.get(TestStore) as TestStore
  act(() => {
    store.change('b')
  })

  expect(screen.getByTestId('test1')).toHaveTextContent('b')
  expect(screen.getByTestId('test2')).toHaveTextContent('b')
  expect(renders).toEqual(2)

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(renders).toEqual(2)
  await delay(20)

  expect(client.objects.has(TestStore)).toBe(false)
  expect(events).toEqual(['constructor', 'change', 'destroy'])
})

it('renders remote store', async () => {
  let events: string[] = []
  class TestStore extends RemoteStore {
    [loaded] = true;
    [loading] = Promise.resolve()

    value = 0

    constructor (c: Client, id: string) {
      super(c, id)
      events.push(`constructor:${id}`)
    }

    inc () {
      this.value += 1
      this[emitter].emit('change', this)
    }

    [destroy] () {
      events.push(`destroy:${this.id}`)
    }
  }

  let client = new TestClient('10')
  let renders = 0

  let Test1: FC<{ id: string }> = ({ id }) => {
    renders += 1
    let [isLoading, test] = useRemoteStore(TestStore, id)
    expect(isLoading).toBe(false)
    return h(
      'div',
      {},
      h('button', {
        'data-testid': 'changeValue',
        'onClick': () => test.inc()
      }),
      h('div', { 'data-testid': 'test1' }, `${test.id}: ${test.value}`)
    )
  }

  let Test2: FC<{ id: string }> = ({ id }) => {
    let [, test] = useRemoteStore(TestStore, id)
    return h('div', { 'data-testid': 'test2' }, `${test.id}: ${test.value}`)
  }

  let Wrapper: FC = () => {
    let [number, set] = useState<number>(1)
    return h(
      'div',
      {},
      h('button', { 'data-testid': 'changeStore', 'onClick': () => set(2) }),
      h(Test1, { id: `test:${number}` }),
      h(Test2, { id: `test:${number}` })
    )
  }

  render(h(ClientContext.Provider, { value: client }, h(Wrapper)))
  expect(screen.getByTestId('test1')).toHaveTextContent('test:1: 0')
  expect(screen.getByTestId('test2')).toHaveTextContent('test:1: 0')
  expect(events).toEqual(['constructor:test:1'])
  expect(renders).toEqual(1)

  act(() => {
    screen.getByTestId('changeValue').click()
  })
  expect(screen.getByTestId('test1')).toHaveTextContent('test:1: 1')
  expect(screen.getByTestId('test2')).toHaveTextContent('test:1: 1')
  expect(events).toEqual(['constructor:test:1'])
  expect(renders).toEqual(2)

  act(() => {
    screen.getByTestId('changeStore').click()
  })
  expect(screen.getByTestId('test1')).toHaveTextContent('test:2: 0')
  expect(screen.getByTestId('test2')).toHaveTextContent('test:2: 0')
  expect(renders).toEqual(3)
  expect(events).toEqual(['constructor:test:1', 'constructor:test:2'])
  expect(client.objects.has('test:1')).toBe(true)
  expect(client.objects.has('test:2')).toBe(true)

  await delay(20)
  expect(events).toEqual([
    'constructor:test:1',
    'constructor:test:2',
    'destroy:test:1'
  ])
  expect(client.objects.has('test:1')).toBe(false)
  expect(client.objects.has('test:2')).toBe(true)
})

it('renders loading store', async () => {
  class TestStore extends RemoteStore {
    resolve = () => {};
    [loaded] = false;
    [loading] = new Promise<void>(resolve => {
      this.resolve = resolve
    })

    change () {
      this[emitter].emit('change', this)
    }
  }

  let client = new TestClient('10')
  let renders = 0

  let Test: FC = () => {
    renders += 1
    let [isLoading, store] = useRemoteStore(TestStore, 'test:1')
    return h('div', { 'data-testid': 'test' }, isLoading ? 'loading' : store.id)
  }

  render(h(ClientContext.Provider, { value: client }, h(Test)))
  expect(screen.getByTestId('test')).toHaveTextContent('loading')
  expect(renders).toEqual(1)

  let store = client.objects.get('test:1') as TestStore
  act(() => {
    store.change()
  })
  expect(renders).toEqual(1)

  await act(async () => {
    store.resolve()
    await delay(1)
  })
  expect(screen.getByTestId('test')).toHaveTextContent('test:1')
  expect(renders).toEqual(2)

  act(() => {
    store.change()
  })
  expect(renders).toEqual(3)
})

it('does not reload store on component changes', async () => {
  let destroyed = ''
  class TestLocalStore extends LocalStore {
    test = 'L';
    [destroy] () {
      destroyed += 'L'
    }
  }
  class TestRemoteStore extends RemoteStore {
    [loaded] = true;
    [loading] = Promise.resolve();
    [destroy] () {
      destroyed += this.id
    }
  }

  let client = new TestClient('10')

  let TestA: FC = () => {
    let local = useLocalStore(TestLocalStore)
    let [, remote] = useRemoteStore(TestRemoteStore, 'R')
    return h('div', { 'data-testid': 'test' }, `1 ${local.test} ${remote.id}`)
  }

  let TestB: FC = () => {
    let local = useLocalStore(TestLocalStore)
    let [, remote] = useRemoteStore(TestRemoteStore, 'R')
    return h('div', { 'data-testid': 'test' }, `2 ${local.test} ${remote.id}`)
  }

  let Switcher: FC = () => {
    let [state, setState] = useState<'a' | 'b' | 'none'>('a')
    if (state === 'a') {
      return h(
        'div',
        {},
        h('button', { onClick: () => setState('b') }),
        h(TestA)
      )
    } else if (state === 'b') {
      return h(
        'div',
        {},
        h('button', { onClick: () => setState('none') }),
        h(TestB)
      )
    } else {
      return null
    }
  }

  render(h(ClientContext.Provider, { value: client }, h(Switcher)))
  expect(screen.getByTestId('test')).toHaveTextContent('1 L R')

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.getByTestId('test')).toHaveTextContent('2 L R')
  expect(destroyed).toEqual('')

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(destroyed).toEqual('')

  await delay(20)
  expect(destroyed).toEqual('LR')
})

it('throws and catches not found error', async () => {
  expect(
    await catchLoadingError(
      new LoguxUndoError({
        type: 'logux/undo',
        reason: 'notFound',
        id: '',
        action: {
          type: 'logux/subscribe',
          channel: 'A'
        }
      })
    )
  ).toEqual('404 notFound')
})

it('throws and catches access denied error', async () => {
  expect(
    await catchLoadingError(
      new LoguxUndoError({
        type: 'logux/undo',
        reason: 'denied',
        id: '',
        action: {
          type: 'logux/subscribe',
          channel: 'A'
        }
      })
    )
  ).toEqual('403 denied')
})

it('throws and catches access server error during loading', async () => {
  expect(
    await catchLoadingError(
      new LoguxUndoError({
        type: 'logux/undo',
        reason: 'error',
        id: '',
        action: {
          type: 'logux/subscribe',
          channel: 'A'
        }
      })
    )
  ).toEqual('500 error')
})

it('ignores unknown error', async () => {
  expect(await catchLoadingError(new Error('Test Error'))).toEqual('Test Error')
})
