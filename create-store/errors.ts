import { createStore } from '../index.js'

let store = createStore<{ value: string }>(() => {
  store.set({ value: '1' })
})

store.listen(value => {
  // THROWS read-only property
  value.value = 2
})
