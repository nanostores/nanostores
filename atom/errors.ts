import { atom, getValue } from '../index.js'

let store = atom<{ value: string }>({ value: '1' })

store.listen(value => {
  // THROWS read-only property
  value.value = 2
})

let fnStore = atom<() => void>(() => {
  fnStore.set(() => {})
})

let fn = getValue(fnStore)
fn()
