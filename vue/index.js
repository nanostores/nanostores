import Vue from 'vue'

import { createFilter } from '../create-filter/index.js'

let {
  ref,
  inject,
  provide,
  computed,
  readonly,
  reactive,
  customRef,
  watchEffect,
  defineComponent,
  onBeforeUnmount,
  onErrorCaptured
} = Vue

const createSymbol = name => {
  return process.env.NODE_ENV !== 'production' ? Symbol(name) : Symbol()
}

export const ClientKey = /*#__PURE__*/ createSymbol('logux-client')
export const ErrorsKey = /*#__PURE__*/ createSymbol('logux-errors')

export function loguxClient (app, client) {
  app.provide(ClientKey, client)
  app.config.globalProperties.$logux = client
}

export function useClient () {
  return inject(ClientKey)
}

export function useStore (store, id, ...builderArgs) {
  let error = ref(null)
  let instance = store
  let unsubscribe

  let triggerUpdate
  let loguxRef = value => {
    return customRef((track, trigger) => {
      triggerUpdate = trigger
      return {
        get: () => {
          track()
          return value
        },
        set: newValue => {
          value = newValue
          trigger()
        }
      }
    })
  }

  let state = loguxRef(null)
  let readonlyState = readonly(state)

  if (typeof id === 'string') {
    id = ref(id)
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!id && typeof store === 'function') {
      throw new Error('Pass store ID with store builder')
    }
  }

  function subscribe () {
    let listener = newState => {
      state.value = newState
      triggerUpdate()
    }
    if (process.env.NODE_ENV === 'production') {
      return store.subscribe(listener)
    } else {
      try {
        return store.subscribe(listener)
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
  }

  if (id) {
    let client = useClient()
    watchEffect(onInvalidate => {
      store = instance(id.value, client, ...builderArgs)
      unsubscribe = subscribe()
      if (store.loading) {
        watchEffect(() => {
          if (error.value) throw error.value
        })
        store.loading.catch(e => {
          error.value = e
        })
      }
      onInvalidate(unsubscribe)
    })
  } else {
    unsubscribe = subscribe()
  }

  if (process.env.NODE_ENV !== 'production') {
    if (store.loading) {
      if (!inject(ErrorsKey, null)) {
        throw new Error(
          'Wrap components in Logux ' +
            '<channel-errors v-slot="{ code, error }">'
        )
      }
    }
  }

  onBeforeUnmount(unsubscribe)

  return readonlyState
}

export let ChannelErrors = defineComponent({
  name: 'LoguxChannelErrors',
  setup (props, { slots }) {
    let error = ref(null)
    let code = computed(() => {
      if (!error.value) {
        return null
      } else {
        let reason = error.value.data.action.reason
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
})

export function useFilter (Builer, filter = {}, opts = {}) {
  let client = useClient()
  let instance = createFilter(client, Builer, filter, opts)
  return useStore(instance)
}
