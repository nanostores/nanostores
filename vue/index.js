import {
  getCurrentInstance,
  onBeforeUnmount,
  triggerRef,
  readonly,
  ref
} from 'vue'

export function useStore(store) {
  let state = ref(null)
  let readonlyState = readonly(state)
  let unsubscribe

  if (process.env.NODE_ENV !== 'production') {
    if (typeof store === 'function') {
      throw new Error(
        'Use useStore(Builder(id)) or useSync() ' +
          'from @logux/state/sync/vue for builders'
      )
    }
  }

  unsubscribe = store.subscribe(newState => {
    state.value = newState
    triggerRef(state)
  })

  getCurrentInstance() && onBeforeUnmount(unsubscribe)

  return readonlyState
}
