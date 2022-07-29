import { atom, WritableAtom } from '../index.js'

let store = atom<{ value: string }>({ value: '1' })

store.listen(value => {
  // THROWS read-only property
  value.value = 2
})

store.notify()
store.notify('value')
// THROWS '"nonExistentKey"' is not assignable to parameter of type '"value"'
store.notify('nonExistentKey')

let fnStore = atom<() => void>(() => {
  fnStore.set(() => {})
})

let fn = fnStore.get()
fn()

fnStore.notify()

let store2 = atom<string | undefined>()
store2.set("new")

// THROWS Expected 1 arguments, but got 0
let store3 = atom<string>()
