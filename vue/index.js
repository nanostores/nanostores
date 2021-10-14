import { getCurrentInstance, onBeforeUnmount, readonly, ref } from 'vue'

export function useStore(store) {
  let state = ref()
  let unsubscribe

  if (process.env.NODE_ENV !== 'production') {
    if (typeof store === 'function') {
      throw new Error(
        'Use useStore(Template(id)) or useSync() ' +
          'from @logux/client/vue for templates'
      )
    }
  }

  unsubscribe = store.subscribe(value => {
    state.value = value
  })

  getCurrentInstance() && onBeforeUnmount(unsubscribe)

  if (process.env.NODE_ENV !== 'production') {
    return readonly(state)
  }
  return state
}
