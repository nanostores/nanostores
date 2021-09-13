import { createAtom, getValue } from '../index.js'

let store = createAtom<{ value: string }>(() => {
  store.set({ value: '1' })
})

store.listen(value => {
  // THROWS read-only property
  value.value = 2
})

let fnStore = createAtom<() => void>(() => {
  fnStore.set(() => {})
})

let fn = getValue(fnStore)
fn()
