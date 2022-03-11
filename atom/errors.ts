import { atom } from '../index.js'

let store = atom<{ value: string }>({ value: '1' })

store.listen(value => {
  // THROWS read-only property
  value.value = 2
})

store.notify()
store.notify("value")
// THROWS '"nonExistentKey"' is not assignable to parameter of type '"value"'
store.notify("nonExistentKey")

let fnStore = atom<() => void>(() => {
  fnStore.set(() => {})
})

let fn = fnStore.get()
fn()

fnStore.notify()
