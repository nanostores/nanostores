import '@testing-library/jest-dom/extend-expect'
import {
  ChannelNotFoundError,
  ChannelDeniedError,
  LoguxUndoError,
  ChannelError,
  TestClient
} from '@logux/client'
import React, { ReactElement, FC } from 'react'
import ReactTesting from '@testing-library/react'
import { delay } from 'nanodelay'
import { jest } from '@jest/globals'

import {
  changeSyncMapById,
  SyncMapBuilder,
  createSyncMap,
  defineSyncMap,
  cleanStores,
  createStore,
  MapBuilder,
  defineMap
} from '../index.js'
import {
  ClientContext,
  ChannelErrors,
  useClient,
  useFilter,
  TestScene,
  useStore
} from './index.js'
import { prepareForTest } from '../prepare-for-test/index.js'

let { render, screen, act } = ReactTesting
let { createElement: h, Component, useState } = React

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

let Broken = defineMap<
  { isLoading: boolean },
  [],
  { loading: Promise<void>; reject(e: Error | string): void }
>(store => {
  store.setKey('isLoading', true)
  store.loading = new Promise<void>((resolve, reject) => {
    store.reject = e => {
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
})

let IdTest: FC<{ Builder: MapBuilder<any, []> }> = ({ Builder }) => {
  let store = useStore(Builder, 'ID')
  return h('div', {}, store.isLoading ? 'loading' : store.id)
}

let SyncTest: FC<{ Builder: SyncMapBuilder }> = ({ Builder }) => {
  let store = useStore(Builder, 'ID')
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
            h(ChannelErrors, {}, h(IdTest, { Builder: Broken }))
          )
        )
      )
    )
  )
  expect(screen.getByTestId('test')).toHaveTextContent('loading')

  await act(async () => {
    Broken('ID').reject(error)
    await delay(1)
  })
  return screen.getByTestId('test').textContent
}

let LocalPost = defineSyncMap<{ projectId: string; title: string }>('local', {
  offline: true,
  remote: false
})

let RemotePost = defineSyncMap<{ title?: string }>('posts')

afterEach(() => {
  cleanStores(Broken, RemotePost)
})

it('throws on missed context for sync map', () => {
  let Test = defineSyncMap<{ name: string }>('test')
  let [errors, Catcher] = getCatcher(() => {
    useStore(Test, 'ID')
  })
  render(h(Catcher))
  expect(errors).toEqual(['Wrap components in Logux <ClientContext.Provider>'])
})

it('throws store init errors', () => {
  let store = createStore(() => {
    throw new Error('Test')
  })
  let Bad: FC = () => h('div', {}, 'error')
  let client = new TestClient('10')
  let [errors, Catcher] = getCatcher(() => {
    useStore(store)
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

it('renders simple store', async () => {
  let events: string[] = []
  let renders = 0

  let letter = createStore<string>(() => {
    events.push('constructor')
    letter.set('a')
    return () => {
      events.push('destroy')
    }
  })

  let Test1: FC = () => {
    renders += 1
    let value = useStore(letter)
    return h('div', { 'data-testid': 'test1' }, value)
  }

  let Test2: FC = () => {
    let value = useStore(letter)
    return h('div', { 'data-testid': 'test2' }, value)
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
  expect(events).toEqual(['constructor'])
  expect(screen.getByTestId('test1')).toHaveTextContent('a')
  expect(screen.getByTestId('test2')).toHaveTextContent('a')
  expect(renders).toEqual(1)

  await act(async () => {
    letter.set('b')
    letter.set('c')
    await delay(1)
  })

  expect(screen.getByTestId('test1')).toHaveTextContent('c')
  expect(screen.getByTestId('test2')).toHaveTextContent('c')
  expect(renders).toEqual(2)

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(renders).toEqual(2)
  await delay(1020)

  expect(events).toEqual(['constructor', 'destroy'])
})

it('throws on missed ID for builder', async () => {
  let [errors, Catcher] = getCatcher(() => {
    // @ts-expect-error
    useStore(RemotePost)
  })
  render(h(Catcher))
  expect(errors).toEqual(['Pass store ID with store builder'])
})

it('builds map', async () => {
  let events: string[] = []
  let Counter = defineMap<{ value: number; id: string }>((store, id) => {
    events.push(`constructor:${id}`)
    store.setKey('value', 0)
    return () => {
      events.push(`destroy:${id}`)
    }
  })

  let renders = 0

  let Test1: FC<{ id: string }> = ({ id }) => {
    renders += 1
    let counter = useStore(Counter, id)
    return h(
      'div',
      {},
      h('button', {
        'data-testid': 'changeValue',
        'onClick': () => {
          Counter(id).setKey('value', counter.value + 1)
        }
      }),
      h('div', { 'data-testid': 'test1' }, `${counter.id} ${counter.value}`)
    )
  }

  let Test2: FC<{ id: string }> = ({ id }) => {
    let test = useStore(Counter, id)
    return h('div', { 'data-testid': 'test2' }, `${test.id} ${test.value}`)
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

  await delay(1020)
  expect(events).toEqual([
    'constructor:test:1',
    'constructor:test:2',
    'destroy:test:1'
  ])
})

it('does not reload store on component changes', async () => {
  let destroyed = ''
  let simple = createStore<string>(() => {
    simple.set('S')
    return () => {
      destroyed += 'S'
    }
  })
  let Map = defineMap<{ id: string }>((store, id) => {
    return () => {
      destroyed += id
    }
  })

  let TestA: FC = () => {
    let simpleValue = useStore(simple)
    let map = useStore(Map, 'M')
    return h('div', { 'data-testid': 'test' }, `1 ${simpleValue} ${map.id}`)
  }

  let TestB: FC = () => {
    let simpleValue = useStore(simple)
    let map = useStore(Map, 'M')
    return h('div', { 'data-testid': 'test' }, `2 ${simpleValue} ${map.id}`)
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
  expect(screen.getByTestId('test')).toHaveTextContent('1 S M')

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.getByTestId('test')).toHaveTextContent('2 S M')
  expect(destroyed).toEqual('')

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(destroyed).toEqual('')

  await delay(1020)
  expect(destroyed).toEqual('SM')
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
      h(ChannelErrors, { Error }, h(IdTest, { Builder: Broken }))
    )
  )
  await act(async () => {
    Broken('ID').reject('denied')
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
      h(ChannelErrors, { Error }, h(IdTest, { Builder: Broken }))
    )
  )
  await act(async () => {
    Broken('ID').reject('notFound')
    await delay(1)
  })
  expect(screen.getByTestId('test')).toHaveTextContent('500 notFound')
})

it('throws an error on missed ChannelErrors', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(
    getText(h(ErrorCatcher, {}, h(SyncTest, { Builder: RemotePost })))
  ).toEqual(
    'Wrap components in Logux ' +
      '<ChannelErrors NotFound={Page404} AccessDenied={Page403}>'
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
          h(SyncTest, { Builder: RemotePost })
        )
      )
    )
  ).toEqual(
    'Wrap components in Logux ' +
      '<ChannelErrors NotFound={Page404} AccessDenied={Page403}>'
  )
})

it('does not throw on ChannelErrors with 404 and 403', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(
    getText(
      h(
        ChannelErrors,
        { NotFound: () => null, AccessDenied: () => null },
        h(SyncTest, { Builder: RemotePost })
      )
    )
  ).toEqual('loading')
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

it('renders filter', async () => {
  let client = new TestClient('10')
  let renders: string[] = []
  let TestList: FC = () => {
    let posts = useFilter(LocalPost, { projectId: '1' }, { sortBy: 'title' })
    expect(posts.stores.size).toEqual(posts.list.length)
    renders.push('list')
    return h(
      'ul',
      { 'data-testid': 'test' },
      posts.list.map((post, index) => {
        renders.push(post.id)
        return h('li', {}, ` ${index}:${post.title}`)
      })
    )
  }

  render(
    h(
      ClientContext.Provider,
      { value: client },
      h(ChannelErrors, { Error: () => null }, h(TestList))
    )
  )
  expect(screen.getByTestId('test').textContent).toEqual('')
  expect(renders).toEqual(['list'])

  await act(async () => {
    await Promise.all([
      createSyncMap(client, LocalPost, { id: '1', projectId: '1', title: 'Y' }),
      createSyncMap(client, LocalPost, { id: '2', projectId: '2', title: 'Y' }),
      createSyncMap(client, LocalPost, { id: '3', projectId: '1', title: 'A' })
    ])
    await delay(10)
  })
  expect(screen.getByTestId('test').textContent).toEqual(' 0:A 1:Y')
  expect(renders).toEqual(['list', 'list', '3', '1'])

  await act(async () => {
    await changeSyncMapById(client, LocalPost, '3', 'title', 'B')
    await delay(10)
  })
  expect(screen.getByTestId('test').textContent).toEqual(' 0:B 1:Y')
  expect(renders).toEqual(['list', 'list', '3', '1', 'list', '3', '1'])

  await act(async () => {
    await changeSyncMapById(client, LocalPost, '3', 'title', 'Z')
    await delay(10)
  })
  expect(screen.getByTestId('test').textContent).toEqual(' 0:Y 1:Z')
  expect(renders).toEqual([
    'list',
    'list',
    '3',
    '1',
    'list',
    '3',
    '1',
    'list',
    '1',
    '3'
  ])
})

it('prepares test scene', () => {
  let client = new TestClient('10')
  let User = defineSyncMap<{ name: string }>('users')
  let UserList: FC = () => {
    let users = useFilter(User)
    if (users.isLoading) {
      return h('div', {}, 'loading')
    } else {
      return h(
        'ul',
        {},
        users.list.map(user =>
          h('li', { key: user.id }, `${user.id}: ${user.name}`)
        )
      )
    }
  }

  prepareForTest(client, User, { name: 'Third' })

  render(
    h(
      'div',
      { 'data-testid': 'test' },
      h(
        TestScene,
        {
          client,
          mocks: [
            [User, { name: 'First' }],
            [User, { name: 'Second' }]
          ]
        },
        h(UserList)
      )
    )
  )
  expect(screen.getByTestId('test').textContent).toEqual(
    'users:1: First' + 'users:2: Second'
  )
})

it('prepares test scene without cleaning', () => {
  let client = new TestClient('10')
  let User = defineSyncMap<{ name: string }>('users')
  let UserList: FC = () => {
    let users = useFilter(User)
    if (users.isLoading) {
      return h('div', {}, 'loading')
    } else {
      return h(
        'ul',
        {},
        users.list.map(user =>
          h('li', { key: user.id }, `${user.id}: ${user.name}`)
        )
      )
    }
  }

  prepareForTest(client, User, { name: 'First' })

  render(
    h(
      'div',
      { 'data-testid': 'test' },
      h(
        TestScene,
        {
          client,
          clean: false,
          mocks: []
        },
        h(UserList)
      )
    )
  )
  expect(screen.getByTestId('test').textContent).toEqual('users:1: First')
})

it('supports errors in test scene', () => {
  let client = new TestClient('10')
  jest.spyOn(console, 'error').mockImplementation(() => {})
  let Denied: FC = () => {
    throw new LoguxUndoError({
      type: 'logux/undo',
      reason: 'denied',
      id: '1 1:1:0 0',
      action: { type: 'foo' }
    })
  }
  render(
    h(
      'div',
      { 'data-testid': 'test' },
      h(TestScene, { client, mocks: [] }, h(Denied))
    )
  )
  expect(screen.getByTestId('test').textContent).toEqual(
    'LoguxUndoError: denied'
  )
})
