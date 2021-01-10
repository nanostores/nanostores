import '@testing-library/jest-dom/extend-expect'
import {
  TestClient,
  Client,
  ChannelNotFoundError,
  ChannelDeniedError,
  ChannelError,
  LoguxUndoError
} from '@logux/client'
import {
  createElement as h,
  FC,
  useState,
  Component,
  ReactElement
} from 'react'
import { render, screen, act } from '@testing-library/react'
import { delay } from 'nanodelay'

import {
  RemoteStoreConstructor,
  ClientLogStore,
  cleanStores,
  RemoteStore,
  loguxClient,
  LocalStore,
  loading,
  destroy,
  change,
  loaded
} from '../index.js'
import {
  useLocalStore,
  useRemoteStore,
  ClientContext,
  ChannelErrors,
  useClient
} from './index.js'

function getCatcher (cb: () => void): [string[], FC] {
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

class BrokenStore extends RemoteStore {
  static rejectLoading: (e: string | Error) => void = () => {};

  [loaded] = false;
  [loading] = new Promise<void>((resolve, reject) => {
    BrokenStore.rejectLoading = e => {
      if (typeof e === 'string') {
        reject(
          new LoguxUndoError({
            type: 'logux/undo',
            reason: e,
            id: '',
            action: {
              type: 'logux/subscribe',
              channel: 'A'
            }
          })
        )
      } else {
        reject(e)
      }
    }
  })
}

class SimpleRemoteState extends RemoteStore {
  [loaded] = true;
  [loading] = Promise.resolve()
}

let IdTest: FC<{ Store: RemoteStoreConstructor }> = ({ Store }) => {
  let store = useRemoteStore(Store, 'ID')
  return h('div', {}, store.isLoading ? 'loading' : store.id)
}

function getText (component: ReactElement) {
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

function runWithClient (component: ReactElement) {
  let client = new TestClient('10')
  render(
    h(
      ClientContext.Provider,
      { value: client },
      h(ChannelErrors, { Error: () => null }, component)
    )
  )
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

async function catchLoadingError (error: string | Error) {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  let Bad: FC = () => h('div', 'bad')
  let NotFound: FC<{ error: ChannelNotFoundError }> = props => {
    return h('div', {}, `404 ${props.error.action.reason}`)
  }
  let AccessDenied: FC<{ error: ChannelDeniedError }> = props => {
    return h('div', {}, `403 ${props.error.action.reason}`)
  }
  let Error: FC<{ error: ChannelError }> = props => {
    return h('div', {}, `500 ${props.error.action.reason}`)
  }
  runWithClient(
    h(
      'div',
      { 'data-testid': 'test' },
      h(
        ErrorCatcher,
        {},
        h(
          ChannelErrors,
          { AccessDenied, NotFound: Bad, Error },
          h(
            ChannelErrors,
            { NotFound },
            h(ChannelErrors, {}, h(IdTest, { Store: BrokenStore }))
          )
        )
      )
    )
  )
  expect(screen.getByTestId('test')).toHaveTextContent('loading')

  await act(async () => {
    BrokenStore.rejectLoading(error)
    await delay(1)
  })
  return screen.getByTestId('test').textContent
}

class SimpleLocalStore extends LocalStore {}

class SimpleRemoteStore extends RemoteStore {
  [loaded] = true;
  [loading] = Promise.resolve()
}

afterEach(() => {
  cleanStores(BrokenStore, SimpleLocalStore, SimpleRemoteStore)
})

it('throws on missed context for client log store', () => {
  class TestStore extends ClientLogStore {
    [loaded] = true;
    [loading] = Promise.resolve()
  }
  let [errors, Catcher] = getCatcher(() => {
    useRemoteStore(TestStore, 'ID')
  })
  render(h(Catcher))
  expect(errors).toEqual(['Wrap components in Logux <ClientContext.Provider>'])
})

it('throws store constructore errors', () => {
  class TestStore extends ClientLogStore {
    [loaded] = true;
    [loading] = Promise.resolve()
    constructor (id: string, c: Client) {
      super(id, c)
      throw new Error('Test')
    }
  }
  let Bad: FC = () => h('div', {}, 'error')
  let client = new TestClient('10')
  let [errors, Catcher] = getCatcher(() => {
    useRemoteStore(TestStore, 'ID')
  })
  render(
    h(
      ClientContext.Provider,
      { value: client },
      h(ChannelErrors, { Error: Bad }, h(Catcher))
    )
  )
  expect(errors).toEqual(['Test'])
})

it('throws on locale store in useRemoteStore', () => {
  let [errors, Catcher] = getCatcher(() => {
    // @ts-expect-error
    useRemoteStore(SimpleLocalStore, '10')
  })
  runWithClient(h(Catcher))
  expect(errors).toEqual([
    'SimpleLocalStore is a local store and need to be created ' +
      'with useLocalStore()'
  ])
})

it('throws on remote store in useLocalStore', () => {
  let [errors, Catcher] = getCatcher(() => {
    // @ts-expect-error
    useLocalStore(SimpleRemoteStore)
  })
  runWithClient(h(Catcher))
  expect(errors).toEqual([
    'SimpleRemoteStore is a remote store and need to be load ' +
      'with useRemoteStore()'
  ])
})

it('renders local store', async () => {
  let events: string[] = []
  let renders = 0

  class TestStore extends LocalStore {
    value = 'a'

    constructor () {
      super()
      events.push('constructor')
    }

    change (value: string) {
      this[change]('value', value)
      events.push('change')
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
      h('button', {
        onClick: () => {
          setShow(false)
        }
      }),
      show && h(Test1),
      show && h(Test2)
    )
  }

  runWithClient(h(Wrapper))
  expect(screen.getByTestId('test1')).toHaveTextContent('a')
  expect(screen.getByTestId('test2')).toHaveTextContent('a')
  expect(renders).toEqual(1)

  let store = TestStore.loaded as TestStore
  await act(async () => {
    store.change('b')
    await delay(1)
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

  expect(TestStore.loaded).toBeUndefined()
  expect(events).toEqual(['constructor', 'change', 'destroy'])
})

it('renders remote store', async () => {
  let events: string[] = []
  class TestStore extends RemoteStore {
    [loaded] = true;
    [loading] = Promise.resolve()

    value = 0

    constructor (id: string) {
      super(id)
      events.push(`constructor:${id}`)
    }

    inc () {
      this[change]('value', this.value + 1)
    }

    [destroy] () {
      events.push(`destroy:${this.id}`)
    }
  }

  let renders = 0

  let Test1: FC<{ id: string }> = ({ id }) => {
    renders += 1
    let test = useRemoteStore(TestStore, id)
    if (test.isLoading) {
      throw new Error('Store is loading')
    } else {
      return h(
        'div',
        {},
        h('button', {
          'data-testid': 'changeValue',
          'onClick': test.inc.bind(test)
        }),
        h('div', { 'data-testid': 'test1' }, `${test.id} ${test.value}`)
      )
    }
  }

  let Test2: FC<{ id: string }> = ({ id }) => {
    let test = useRemoteStore(TestStore, id)
    if (test.isLoading) {
      throw new Error('Store is loading')
    } else {
      return h('div', { 'data-testid': 'test2' }, `${test.id} ${test.value}`)
    }
  }

  let Wrapper: FC = () => {
    let [number, set] = useState<number>(1)
    return h(
      'div',
      {},
      h('button', {
        'data-testid': 'changeStore',
        'onClick': () => {
          set(2)
        }
      }),
      h(Test1, { id: `test:${number}` }),
      h(Test2, { id: `test:${number}` })
    )
  }

  runWithClient(h(Wrapper))
  expect(screen.getByTestId('test1')).toHaveTextContent('test:1 0')
  expect(screen.getByTestId('test2')).toHaveTextContent('test:1 0')
  expect(events).toEqual(['constructor:test:1'])
  expect(renders).toEqual(1)

  await act(async () => {
    screen.getByTestId('changeValue').click()
    await delay(1)
  })
  expect(screen.getByTestId('test1')).toHaveTextContent('test:1 1')
  expect(screen.getByTestId('test2')).toHaveTextContent('test:1 1')
  expect(events).toEqual(['constructor:test:1'])
  expect(renders).toEqual(2)

  act(() => {
    screen.getByTestId('changeStore').click()
  })
  expect(screen.getByTestId('test1')).toHaveTextContent('test:2 0')
  expect(screen.getByTestId('test2')).toHaveTextContent('test:2 0')
  expect(renders).toEqual(3)
  expect(events).toEqual(['constructor:test:1', 'constructor:test:2'])
  expect(TestStore.loaded?.has('test:1')).toBe(true)
  expect(TestStore.loaded?.has('test:2')).toBe(true)

  await delay(20)
  expect(events).toEqual([
    'constructor:test:1',
    'constructor:test:2',
    'destroy:test:1'
  ])
  expect(TestStore.loaded?.has('test:1')).toBe(false)
  expect(TestStore.loaded?.has('test:2')).toBe(true)
})

it('renders loading store', async () => {
  class TestStore extends RemoteStore {
    resolve = () => {};
    [loaded] = false;
    [loading] = new Promise<void>(resolve => {
      this.resolve = resolve
    })

    value = 0

    change () {
      this[change]('value', this.value + 1)
    }
  }

  let renders = 0

  let Test: FC = () => {
    renders += 1
    let store = useRemoteStore(TestStore, 'test:1')
    return h(
      'div',
      { 'data-testid': 'test' },
      store.isLoading ? 'loading' : store.id
    )
  }

  runWithClient(h(Test))
  expect(screen.getByTestId('test')).toHaveTextContent('loading')
  expect(renders).toEqual(1)

  let store = TestStore.loaded?.get('test:1') as TestStore
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

  store.change()
  expect(renders).toEqual(2)

  await act(async () => {
    await delay(1)
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

  let TestA: FC = () => {
    let local = useLocalStore(TestLocalStore)
    let remote = useRemoteStore(TestRemoteStore, 'R')
    if (remote.isLoading) throw new Error('Store was not loaded')
    return h('div', { 'data-testid': 'test' }, `1 ${local.test} ${remote.id}`)
  }

  let TestB: FC = () => {
    let local = useLocalStore(TestLocalStore)
    let remote = useRemoteStore(TestRemoteStore, 'R')
    if (remote.isLoading) throw new Error('Store was not loaded')
    return h('div', { 'data-testid': 'test' }, `2 ${local.test} ${remote.id}`)
  }

  let Switcher: FC = () => {
    let [state, setState] = useState<'a' | 'b' | 'none'>('a')
    if (state === 'a') {
      return h(
        'div',
        {},
        h('button', {
          onClick: () => {
            setState('b')
          }
        }),
        h(TestA)
      )
    } else if (state === 'b') {
      return h(
        'div',
        {},
        h('button', {
          onClick: () => {
            setState('none')
          }
        }),
        h(TestB)
      )
    } else {
      return null
    }
  }

  runWithClient(h(Switcher))
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
  expect(await catchLoadingError('notFound')).toEqual('404 notFound')
})

it('throws and catches access denied error', async () => {
  expect(await catchLoadingError('denied')).toEqual('403 denied')
})

it('throws and catches access server error during loading', async () => {
  expect(await catchLoadingError('error')).toEqual('500 error')
})

it('ignores unknown error', async () => {
  expect(await catchLoadingError(new Error('Test Error'))).toEqual('Test Error')
})

it('could process denied via common error component', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  let Error: FC<{ error: ChannelError }> = props => {
    return h('div', {}, `500 ${props.error.action.reason}`)
  }
  runWithClient(
    h(
      'div',
      { 'data-testid': 'test' },
      h(ChannelErrors, { Error }, h(IdTest, { Store: BrokenStore }))
    )
  )
  await act(async () => {
    BrokenStore.rejectLoading('denied')
    await delay(1)
  })
  expect(screen.getByTestId('test')).toHaveTextContent('500 denied')
})

it('could process not found via common error component', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  let Error: FC<{ error: ChannelError }> = props => {
    return h('div', {}, `500 ${props.error.action.reason}`)
  }
  runWithClient(
    h(
      'div',
      { 'data-testid': 'test' },
      h(ChannelErrors, { Error }, h(IdTest, { Store: BrokenStore }))
    )
  )
  await act(async () => {
    BrokenStore.rejectLoading('notFound')
    await delay(1)
  })
  expect(screen.getByTestId('test')).toHaveTextContent('500 notFound')
})

it('throws an error on missed ChannelErrors', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(
    getText(h(ErrorCatcher, {}, h(IdTest, { Store: SimpleRemoteState })))
  ).toEqual(
    'Wrap components in Logux ' +
      '<ChannelErrors NotFound={Page 404} AccessDenied={Page403}>'
  )
})

it('throws an error on ChannelErrors with missed argument', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(
    getText(
      h(
        ErrorCatcher,
        {},
        h(
          ChannelErrors,
          { NotFound: () => null },
          h(IdTest, { Store: SimpleRemoteState })
        )
      )
    )
  ).toEqual(
    'Wrap components in Logux ' +
      '<ChannelErrors NotFound={Page 404} AccessDenied={Page403}>'
  )
})

it('does not throw on ChannelErrors with 404 and 403', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(
    getText(
      h(
        ChannelErrors,
        { NotFound: () => null, AccessDenied: () => null },
        h(IdTest, { Store: SimpleRemoteState })
      )
    )
  ).toEqual('ID')
})

it('checks that isLoading was called', () => {
  class User extends RemoteStore {
    [loaded] = true;
    [loading] = Promise.resolve()
    name!: string
  }
  let MissedCheck: FC = () => {
    let remote = useRemoteStore(User, 'ID')
    // @ts-expect-error
    return h('div', {}, remote.name)
  }
  jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(
    getText(
      h(
        ErrorCatcher,
        {},
        h(ChannelErrors, { Error: () => null }, h(MissedCheck))
      )
    )
  ).toEqual('You need to check `store.isLoading` before calling any properties')
})

it('allows to read store.id before isLoading', () => {
  let DirectIdRead: FC = () => {
    let remote = useRemoteStore(SimpleRemoteState, 'ID')
    return h('div', {}, remote.id)
  }
  expect(
    getText(
      h(
        ErrorCatcher,
        {},
        h(ChannelErrors, { Error: () => null }, h(DirectIdRead))
      )
    )
  ).toEqual('ID')
})

it('sets client', () => {
  class TestStore extends ClientLogStore {
    [loaded] = true;
    [loading] = Promise.resolve()
  }
  let Test: FC = () => {
    let store = useRemoteStore(TestStore, '10')
    if (store.isLoading) {
      return h('div', {}, 'loading')
    } else {
      return h('div', {}, store[loguxClient].options.userId)
    }
  }
  let Error: FC = () => h('div', {}, 'error')
  let client = new TestClient('10')
  expect(
    getText(
      h(
        ClientContext.Provider,
        { value: client },
        h(ChannelErrors, { Error }, h(Test))
      )
    )
  ).toEqual('10')
})

it('has hook to get client', () => {
  let Test: FC = () => {
    let client = useClient()
    return h('div', {}, client.options.userId)
  }
  let client = new TestClient('10')
  expect(
    getText(h(ClientContext.Provider, { value: client }, h(Test)))
  ).toEqual('10')
})
