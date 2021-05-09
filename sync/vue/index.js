import {
  getCurrentInstance,
  onBeforeUnmount,
  onErrorCaptured,
  watchEffect,
  triggerRef,
  reactive,
  readonly,
  computed,
  provide,
  inject,
  watch,
  isRef,
  toRef,
  ref
} from 'vue'

import { createFilter } from '../create-filter/index.js'

const createSymbol = name => {
  return process.env.NODE_ENV !== 'production' ? Symbol(name) : Symbol()
}

export const ClientKey = /*#__PURE__*/ createSymbol('logux-client')
export const ErrorsKey = /*#__PURE__*/ createSymbol('logux-errors')

export function loguxClient(app, client) {
  app.provide(ClientKey, client)
  app.config.globalProperties.$logux = client
}

export function useClient() {
  return getCurrentInstance && inject(ClientKey)
}

function checkErrorProcessor() {
  if (process.env.NODE_ENV !== 'production') {
    let errorProcessor = getCurrentInstance() && inject(ErrorsKey, null)
    if (!errorProcessor) {
      throw new Error(
        'Wrap components in Logux ' +
          '<channel-errors v-slot="{ code, error }">'
      )
    }
  }
}

function useSyncStore(store) {
  let error = ref(null)
  let state = ref(null)
  let unsubscribe

  let listener = newState => {
    state.value = newState
    triggerRef(state)
  }

  if (process.env.NODE_ENV === 'production') {
    unsubscribe = store.subscribe(listener)
  } else {
    try {
      unsubscribe = store.subscribe(listener)
    } catch (e) {
      if (e.message === 'Missed Logux client') {
        throw new Error(
          `Sync Map or Map Store was instantiated before calling\n` +
            `app.use(loguxClient, client)`
        )
      } else {
        throw e
      }
    }
  }

  if (store.loading) {
    watchEffect(() => {
      if (error.value) throw error.value
    })
    store.loading.catch(e => {
      error.value = e
    })
  }

  getCurrentInstance() && onBeforeUnmount(unsubscribe)

  return state
}

export function useSync(Builder, id, ...builderArgs) {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof Builder !== 'function') {
      throw new Error('Use useStore() from @logux/state/vue for stores')
    }
  }

  if (typeof id === 'string') {
    id = ref(id)
  }

  let client = useClient()
  checkErrorProcessor()

  let state = reactive({ value: null })
  let readonlyState = readonly(toRef(state, 'value'))
  let store

  watch(
    id,
    () => {
      store = Builder(id.value, client, ...builderArgs)
      state.value = useSyncStore(store)
    },
    { immediate: true }
  )

  return readonlyState
}

export function useFilter(Builder, filter = {}, opts = {}) {
  if (!isRef(filter)) filter = ref(filter)
  if (!isRef(opts)) opts = ref(opts)

  let client = useClient()
  checkErrorProcessor()

  let store
  let state = reactive({ value: null })
  let readonlyState = readonly(toRef(state, 'value'))

  watch(
    [filter, opts],
    () => {
      store = createFilter(client, Builder, filter.value, opts.value)
      state.value = useSyncStore(store)
    },
    { deep: true, immediate: true }
  )

  return readonlyState
}

export let ChannelErrors = {
  name: 'LoguxChannelErrors',
  setup(props, { slots }) {
    let error = ref(null)
    let code = computed(() => {
      if (!error.value) {
        return null
      } else {
        let { reason } = error.value.data.action
        if (reason === 'notFound') {
          return 404
        } else if (reason === 'denied') {
          return 403
        } else {
          return 500
        }
      }
    })

    if (process.env.NODE_ENV !== 'production') {
      provide(ErrorsKey, readonly(reactive({ code, error })))
    }

    onErrorCaptured((e, instance, info) => {
      if (e.name === 'LoguxUndoError') {
        error.value = { data: e, instance, info }
        return false
      }
    })

    return () => {
      return slots.default ? slots.default({ code, error }) : null
    }
  }
}
