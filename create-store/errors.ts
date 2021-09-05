import { createStore, getValue } from '../index.js'

let store = createStore<{ value: string }>(() => {
  store.set({ value: '1' })
})

store.listen(value => {
  // THROWS read-only property
  value.value = 2
})

let fnStore = createStore<() => void>(() => {
  fnStore.set(() => {})
})

let fn = getValue(fnStore)
fn()
