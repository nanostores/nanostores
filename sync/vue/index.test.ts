import '@testing-library/jest-dom/extend-expect'
import { LoguxUndoError, TestClient } from '@logux/client'
import Vue, { Component, isReadonly } from 'vue'
import VueTesting from '@testing-library/vue'
import { delay } from 'nanodelay'
import { jest } from '@jest/globals'

import {
  changeSyncMapById,
  SyncMapBuilder,
  defineSyncMap,
  createSyncMap
} from '../index.js'
import {
  ChannelErrorsSlotProps,
  ChannelErrors,
  loguxClient,
  useClient,
  useFilter,
  useSync
} from './index.js'
import { cleanStores, createStore, defineMap, MapBuilder } from '../../index.js'

let { render, screen } = VueTesting
let { onErrorCaptured, defineComponent, nextTick, ref, h } = Vue

function getCatcher(cb: () => void): [string[], Component] {
  let errors: string[] = []
  let Catcher = defineComponent(() => {
    try {
      cb()
    } catch (e) {
      errors.push(e.message)
    }
    return () => null
  })
  return [errors, Catcher]
}

function renderWithClient(component: Component, client?: TestClient): void {
  client = client || new TestClient('10')
  render(component, {
    global: {
      plugins: [[loguxClient, client]]
    }
  })
}

async function getText(component: Component): Promise<string | null> {
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

let defineIdTest = (Builder: SyncMapBuilder | MapBuilder): Component => {
  return defineComponent(() => {
    let store = useSync(Builder, 'ID')
    return () => {
      return h('div', store.value.isLoading ? 'loading' : store.value.id)
    }
  })
}

let defineSyncTest = (Builder: SyncMapBuilder): Component => {
  return defineComponent(() => {
    let store = useSync(Builder, 'ID')
    return () => h('div', store.value.isLoading ? 'loading' : store.value.id)
  })
}

let ErrorCatcher = defineComponent((props, { slots }) => {
  let message = ref<null | {}>(null)
  onErrorCaptured(e => {
    // @ts-ignore
    message.value = e.message
    return false
  })
  return () => (message.value ? h('div', message.value) : slots.default?.())
})

async function catchLoadingError(
  error: string | Error
): Promise<string | null> {
  let IdTest = defineIdTest(BrokenStore)

  renderWithClient(
    defineComponent(() => () =>
      h(
        'div',
        { 'data-testid': 'test' },
        h(ErrorCatcher, null, {
          default: () =>
            h(ChannelErrors, null, {
              default: () =>
                h(ChannelErrors, null, {
                  default: () =>
                    h(ChannelErrors, null, {
                      default: ({ error: e, code }: ChannelErrorsSlotProps) => {
                        if (!e.value && !code.value) {
                          return h(IdTest)
                        } else {
                          return h(
                            'div',
                            `${code.value} ${e.value?.data.action.reason}`
                          )
                        }
                      }
                    })
                })
            })
        })
      )
    )
  )
  await nextTick()
  expect(screen.getByTestId('test')).toHaveTextContent('loading')

  BrokenStore('ID').reject(error)
  await delay(10)
  await nextTick()
  return screen.getByTestId('test').textContent
}

let LocalPostStore = defineSyncMap<{ projectId: string; title: string }>(
  'local',
  {
    offline: true,
    remote: false
  }
)

let RemotePostStore = defineSyncMap<{ title?: string }>('posts')

let BrokenStore = defineMap<
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

afterEach(() => {
  cleanStores(BrokenStore, LocalPostStore, RemotePostStore)
})

it('throws on missed logux client dependency', () => {
  let spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  let Test = defineSyncMap<{ name: string }>('test')
  let [errors, Catcher] = getCatcher(() => {
    useSync(Test, 'ID')
  })
  render(
    h(ChannelErrors, null, {
      default: () => h(Catcher)
    })
  )
  expect(errors).toEqual([
    `Sync Map or Map Store was instantiated before calling\n` +
      `app.use(loguxClient, client)`
  ])
  spy.mockRestore()
})

it('throws on missed ID for builder', () => {
  let spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  let store = createStore<undefined>()
  let [errors, Catcher] = getCatcher(() => {
    // @ts-expect-error
    useSync(store)
  })
  render(h(Catcher))
  expect(errors).toEqual(['Use useStore() from @logux/state/vue for stores'])
  spy.mockRestore()
})

it('throws store init errors', () => {
  let spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  let Builder = defineMap(() => {
    throw new Error('Test')
  })
  let [errors, Catcher] = getCatcher(() => {
    useSync(Builder, 'id')
  })
  render(
    h(ChannelErrors, null, {
      default: () => h(Catcher)
    })
  )
  expect(errors).toEqual(['Test'])
  spy.mockRestore()
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

it('throws an error on missed ChannelErrors', async () => {
  let spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  let SyncTest = defineSyncTest(RemotePostStore)
  expect(
    await getText(
      defineComponent(() => () =>
        h(ErrorCatcher, null, {
          default: () => h(SyncTest)
        })
      )
    )
  ).toEqual(
    'Wrap components in Logux <channel-errors v-slot="{ code, error }">'
  )
  spy.mockRestore()
})

it('has composable to get client', async () => {
  expect(
    await getText(
      defineComponent(() => {
        let client = useClient()
        return () => h('div', client.options.userId)
      })
    )
  ).toEqual('10')
})

it('composables return readonly', () => {
  renderWithClient(
    defineComponent(() => () =>
      h(ChannelErrors, null, {
        default: () =>
          h(
            defineComponent(() => {
              let state = useSync(RemotePostStore, 'ID')
              let list = useFilter(RemotePostStore)
              expect(isReadonly(state)).toEqual(true)
              expect(isReadonly(list)).toEqual(true)
              return () => null
            })
          )
      })
    )
  )
})

it('renders filter', async () => {
  let client = new TestClient('10')
  let renders: string[] = []
  let TestList = defineComponent(() => {
    let posts = useFilter(LocalPostStore, { projectId: '1' })
    expect(posts.value.stores.size).toEqual(posts.value.list.length)
    return () => {
      renders.push('list')
      return h(
        'ul',
        { 'data-testid': 'test' },
        posts.value.list.map((post, index) => {
          renders.push(post.id)
          return h('li', ` ${index}:${post.title}`)
        })
      )
    }
  })

  renderWithClient(
    defineComponent(() => () =>
      h(ChannelErrors, null, {
        default: () => h(TestList)
      })
    ),
    client
  )
  expect(screen.getByTestId('test').textContent).toEqual('')
  expect(renders).toEqual(['list'])

  await Promise.all([
    createSyncMap(client, LocalPostStore, {
      id: '1',
      projectId: '1',
      title: 'Y'
    }),
    createSyncMap(client, LocalPostStore, {
      id: '2',
      projectId: '2',
      title: 'Y'
    }),
    createSyncMap(client, LocalPostStore, {
      id: '3',
      projectId: '1',
      title: 'A'
    })
  ])
  await nextTick()
  expect(screen.getByTestId('test').textContent).toEqual(' 0:Y 1:A')
  expect(renders).toEqual(['list', 'list', '1', '3'])

  await changeSyncMapById(client, LocalPostStore, '3', 'title', 'B')
  await nextTick()
  expect(screen.getByTestId('test').textContent).toEqual(' 0:Y 1:B')
  expect(renders).toEqual(['list', 'list', '1', '3', 'list', '1', '3'])

  await changeSyncMapById(client, LocalPostStore, '3', 'title', 'Z')
  await nextTick()
  expect(screen.getByTestId('test').textContent).toEqual(' 0:Y 1:Z')
  expect(renders).toEqual([
    'list',
    'list',
    '1',
    '3',
    'list',
    '1',
    '3',
    'list',
    '1',
    '3'
  ])
})

it('recreating filter on args changes', async () => {
  let client = new TestClient('10')
  let renders: string[] = []
  let TestList = defineComponent(() => {
    let filter = ref({ projectId: '1' })
    let posts = useFilter(LocalPostStore, filter)
    return () => {
      renders.push('list')
      return h('div', {}, [
        h('button', {
          'data-testid': 'change',
          'onClick': () => {
            filter.value.projectId = '2'
          }
        }),
        h(
          'ul',
          { 'data-testid': 'test' },
          posts.value.list.map((post, index) => {
            renders.push(post.id)
            return h('li', ` ${index}:${post.title}`)
          })
        )
      ])
    }
  })

  renderWithClient(
    defineComponent(() => () =>
      h(ChannelErrors, null, {
        default: () => h(TestList)
      })
    ),
    client
  )
  expect(screen.getByTestId('test').textContent).toEqual('')
  expect(renders).toEqual(['list'])

  await Promise.all([
    createSyncMap(client, LocalPostStore, {
      id: '1',
      projectId: '1',
      title: 'Y'
    }),
    createSyncMap(client, LocalPostStore, {
      id: '2',
      projectId: '2',
      title: 'Y'
    }),
    createSyncMap(client, LocalPostStore, {
      id: '3',
      projectId: '1',
      title: 'A'
    })
  ])
  expect(screen.getByTestId('test').textContent).toEqual(' 0:Y 1:A')
  expect(renders).toEqual(['list', 'list', '1', '3'])

  screen.getByTestId('change').click()
  await Promise.all([
    createSyncMap(client, LocalPostStore, {
      id: '1',
      projectId: '1',
      title: 'Y'
    }),
    createSyncMap(client, LocalPostStore, {
      id: '2',
      projectId: '2',
      title: 'Y'
    }),
    createSyncMap(client, LocalPostStore, {
      id: '3',
      projectId: '1',
      title: 'A'
    })
  ])
  expect(screen.getByTestId('test').textContent).toEqual(' 0:Y')
  expect(renders).toEqual(['list', 'list', '1', '3', 'list', 'list', '2'])
})
