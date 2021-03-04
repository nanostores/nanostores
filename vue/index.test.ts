import '@testing-library/jest-dom/extend-expect'
import Vue, { Component, DeepReadonly, Ref } from 'vue'
import { LoguxUndoError, TestClient } from '@logux/client'
import VueTesting from '@testing-library/vue'
import { delay } from 'nanodelay'
import { jest } from '@jest/globals'

import {
  defineMap,
  MapBuilder,
  cleanStores,
  createStore,
  defineSyncMap,
  createSyncMap,
  SyncMapBuilder,
  changeSyncMapById
} from '../index.js'
import {
  useStore,
  useClient,
  useFilter,
  loguxClient,
  ChannelErrors,
  ChannelErrorsSlotProps
} from './index.js'

let {
  h,
  ref,
  toRefs,
  nextTick,
  computed,
  defineComponent,
  onErrorCaptured
} = Vue
let { render, screen } = VueTesting

function getCatcher (cb: () => void): [string[], Component] {
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

function renderWithClient (component: Component) {
  let client = new TestClient('10')
  return render(component, {
    global: {
      plugins: [[loguxClient, client]]
    }
  })
}

async function getText (component: Component) {
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

let LocalPostStore = defineSyncMap<{ projectId: string; title: string }>(
  'local',
  {
    offline: true,
    remote: false
  }
)

let RemotePostStore = defineSyncMap<{ title?: string }>('posts')

afterEach(() => {
  cleanStores(BrokenStore, RemotePostStore)
})

it('throws on missed loguxClient plugin install for sync map', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  let Test = defineSyncMap<{ name: string }>('test')
  let [errors, Catcher] = getCatcher(() => {
    useStore(Test, 'ID')
  })
  render(Catcher)
  expect(errors).toEqual([
    `Sync Map or Map Store was instantiated before calling\n` +
      `app.use(loguxClient, client)`
  ])
})

it('throws on missed ID for builder', async () => {
  let [errors, Catcher] = getCatcher(() => {
    // @ts-expect-error
    useStore(RemotePostStore)
  })
  render(Catcher)
  expect(errors).toEqual(['Pass store ID with store builder'])
})

it('throws store init errors', () => {
  let store = createStore(() => {
    throw new Error('Test')
  })
  let client = new TestClient('10')
  let [errors, Catcher] = getCatcher(() => {
    useStore(store)
  })
  render(
    defineComponent(() => () =>
      h(ChannelErrors, null, {
        default: () => h(Catcher)
      })
    ),
    {
      global: {
        plugins: [[loguxClient, client]]
      }
    }
  )
  expect(errors).toEqual(['Test'])
})

it('renders simple store', async () => {
  let events: string[] = []
  let renders = 0

  let letterStore = createStore<string>(() => {
    events.push('constructor')
    letterStore.set('a')
    return () => {
      events.push('destroy')
    }
  })

  let Test1 = defineComponent(() => {
    let store = useStore(letterStore)
    return () => {
      renders += 1
      return h('div', { 'data-testid': 'test1' }, store.value)
    }
  })

  let Test2 = defineComponent(() => {
    let store = useStore(letterStore)
    return () => h('div', { 'data-testid': 'test2' }, store.value)
  })

  let Wrapper = defineComponent(() => {
    let show = ref(true)
    return () =>
      h('div', [
        h('button', {
          onClick: () => {
            show.value = false
          }
        }),
        show.value && h(Test1),
        show.value && h(Test2)
      ])
  })

  renderWithClient(Wrapper)
  expect(events).toEqual(['constructor'])
  expect(screen.getByTestId('test1')).toHaveTextContent('a')
  expect(screen.getByTestId('test2')).toHaveTextContent('a')
  expect(renders).toEqual(1)

  letterStore.set('b')
  letterStore.set('c')
  await nextTick()

  expect(screen.getByTestId('test1')).toHaveTextContent('c')
  expect(screen.getByTestId('test2')).toHaveTextContent('c')
  expect(renders).toEqual(2)

  screen.getByRole('button').click()
  await nextTick()
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(renders).toEqual(2)
  await delay(1020)

  expect(events).toEqual(['constructor', 'destroy'])
})

it('builds map', async () => {
  let events: string[] = []
  let renders = 0

  let Counter = defineMap<{ value: number; id: string }>((store, id) => {
    events.push(`constructor:${id}`)
    store.setKey('value', 0)
    return () => {
      events.push(`destroy:${id}`)
    }
  })

  let Test1 = defineComponent({
    props: ['id'],
    setup (props) {
      let { id } = toRefs(props)
      let counter = useStore(Counter, id)
      let text = computed(() => `${counter.value.id} ${counter.value.value}`)
      function setKey () {
        Counter(id.value).setKey('value', counter.value.value + 1)
      }
      return () => {
        renders += 1
        return h('div', [
          h('button', {
            'data-testid': 'changeValue',
            'onClick': setKey
          }),
          h('div', { 'data-testid': 'test1' }, text.value)
        ])
      }
    }
  })

  let Test2 = defineComponent({
    props: ['id'],
    setup (props) {
      let { id } = toRefs(props)
      let counter = useStore(Counter, id)
      let text = computed(() => `${counter.value.id} ${counter.value.value}`)
      return () => h('div', { 'data-testid': 'test2' }, text.value)
    }
  })

  let Wrapper = defineComponent(() => {
    let number = ref(1)
    let id = computed(() => `test:${number.value}`)
    return () =>
      h('div', [
        h('button', {
          'data-testid': 'changeStore',
          'onClick': () => {
            number.value = 2
          }
        }),
        h(Test1, { id: id.value }),
        h(Test2, { id: id.value })
      ])
  })

  renderWithClient(Wrapper)
  expect(screen.getByTestId('test1')).toHaveTextContent('test:1 0')
  expect(screen.getByTestId('test2')).toHaveTextContent('test:1 0')
  expect(events).toEqual(['constructor:test:1'])
  expect(renders).toEqual(1)

  screen.getByTestId('changeValue').click()
  await nextTick()
  expect(screen.getByTestId('test1')).toHaveTextContent('test:1 1')
  expect(screen.getByTestId('test2')).toHaveTextContent('test:1 1')
  expect(events).toEqual(['constructor:test:1'])
  expect(renders).toEqual(2)

  screen.getByTestId('changeStore').click()
  await nextTick()
  expect(screen.getByTestId('test1')).toHaveTextContent('test:2 0')
  expect(screen.getByTestId('test2')).toHaveTextContent('test:2 0')
  expect(renders).toEqual(3)

  await delay(1020)
  expect(events).toEqual([
    'constructor:test:1',
    'constructor:test:2',
    'destroy:test:1'
  ])
})

it('does not reload store on component changes', async () => {
  let destroyed = ''
  let simpleStore = createStore<string>(() => {
    simpleStore.set('S')
    return () => {
      destroyed += 'S'
    }
  })
  let Map = defineMap<{ id: string }>((store, id) => {
    return () => {
      destroyed += id
    }
  })

  let TestA = defineComponent(() => {
    let simple = useStore(simpleStore)
    let map = useStore(Map, 'M')
    let text = computed(() => `1 ${simple.value} ${map.value.id}`)
    return () => h('div', { 'data-testid': 'test' }, text.value)
  })

  let TestB = defineComponent(() => {
    let simple = useStore(simpleStore)
    let map = useStore(Map, 'M')
    let text = computed(() => `2 ${simple.value} ${map.value.id}`)
    return () => h('div', { 'data-testid': 'test' }, text.value)
  })

  let Switcher = defineComponent(() => {
    let state = ref('a')
    return () => {
      if (state.value === 'a') {
        return h('div', {}, [
          h('button', {
            onClick: () => {
              state.value = 'b'
            }
          }),
          h(TestA)
        ])
      } else if (state.value === 'b') {
        return h('div', {}, [
          h('button', {
            onClick: () => {
              state.value = 'none'
            }
          }),
          h(TestB)
        ])
      } else {
        return null
      }
    }
  })

  renderWithClient(Switcher)
  expect(screen.getByTestId('test')).toHaveTextContent('1 S M')

  screen.getByRole('button').click()
  await nextTick()
  expect(screen.getByTestId('test')).toHaveTextContent('2 S M')
  expect(destroyed).toEqual('')

  screen.getByRole('button').click()
  await nextTick()
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(destroyed).toEqual('')

  await delay(1020)
  expect(destroyed).toEqual('SM')
})

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

let defineIdTest = (Builder: MapBuilder<any, []>): Component => {
  return defineComponent(() => {
    let store = useStore(Builder, 'ID')
    return () => h('div', store.value.isLoading ? 'loading' : store.value.id)
  })
}

let ErrorCatcher = defineComponent((props, { slots }) => {
  let message = ref(null)
  onErrorCaptured(e => {
    // @ts-ignore
    message.value = e.message
    return false
  })
  return () => (slots.default ? slots.default({ message }) : null)
})

type ErrorCatcherSlotProps = DeepReadonly<{
  message: Ref<string>
}>

async function catchLoadingError (error: string | Error) {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  let IdTest = defineIdTest(BrokenStore)

  renderWithClient(
    defineComponent(() => () =>
      h(
        'div',
        {
          'data-testid': 'test'
        },
        h(ErrorCatcher, null, {
          default: ({ message }: ErrorCatcherSlotProps) => {
            if (message.value) {
              return h('div', message.value)
            } else {
              return h(ChannelErrors, null, {
                default: () =>
                  h(ChannelErrors, null, {
                    default: () =>
                      h(ChannelErrors, null, {
                        default: ({
                          error: e,
                          code
                        }: ChannelErrorsSlotProps) => {
                          if (!e.value && !code.value) {
                            return h(IdTest)
                          } else {
                            return h(
                              'div',
                              `${code.value} ${
                                e.value ? e.value.data.action.reason : null
                              }`
                            )
                          }
                        }
                      })
                  })
              })
            }
          }
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

let defineSyncTest = (Builder: SyncMapBuilder): Component => {
  return defineComponent(() => {
    let store = useStore(Builder, 'ID')
    return () => h('div', store.value.isLoading ? 'loading' : store.value.id)
  })
}

it('throws an error on missed ChannelErrors', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  let SyncTest = defineSyncTest(RemotePostStore)
  expect(
    await getText(
      defineComponent(() => () =>
        h(ErrorCatcher, null, {
          default: ({ message }: ErrorCatcherSlotProps) => {
            if (message.value) {
              return h('div', message.value)
            } else {
              return h(SyncTest)
            }
          }
        })
      )
    )
  ).toEqual(
    'Wrap components in Logux <channel-errors v-slot="{ code, error }">'
  )
})

it('has hook to get client', async () => {
  expect(
    await getText(
      defineComponent(() => {
        let client = useClient()
        return () => h('div', client.options.userId)
      })
    )
  ).toEqual('10')
})

it('renders filter', async () => {
  let client = new TestClient('10')
  let renders: string[] = []
  let TestList = defineComponent(() => {
    let posts = useFilter(
      LocalPostStore,
      { projectId: '1' },
      { sortBy: 'title' }
    )
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

  render(
    defineComponent(() => () =>
      h(ChannelErrors, null, {
        default: () => h(TestList)
      })
    ),
    {
      global: {
        plugins: [[loguxClient, client]]
      }
    }
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
  expect(screen.getByTestId('test').textContent).toEqual(' 0:A 1:Y')
  expect(renders).toEqual(['list', 'list', '3', '1'])

  await changeSyncMapById(client, LocalPostStore, '3', 'title', 'B')
  await nextTick()
  expect(screen.getByTestId('test').textContent).toEqual(' 0:B 1:Y')
  expect(renders).toEqual(['list', 'list', '3', '1', 'list', '3', '1'])

  await changeSyncMapById(client, LocalPostStore, '3', 'title', 'Z')
  await nextTick()
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
