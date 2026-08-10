import { mapCreator } from '../index.js'

let User = mapCreator<
  { name: string },
  [boolean],
  { rename(name: string): void }
>((store, id, admin) => {
  store.set({ id, name: admin ? 'Admin' : 'User' })
  store.rename = name => {
    store.setKey('name', name)
  }
})

// `id` is set when the store is built, so every path exposes it.
let user = User('1', true)
let id: string = user.get().id

let built = User.build('2', false)
let builtId: string = built.get().id

let cached = User.cache['1']
let cachedId: undefined | string = cached?.get().id

// `rename` is assigned by the initializer, so a store that has not mounted
// yet does not have it.
// THROWS Property 'rename' does not exist
user.rename('New name')
// THROWS Property 'rename' does not exist
User.cache['1']?.rename('New name')

// Without a declared `StoreExt`, the initializer's store has no arbitrary
// properties either.
mapCreator<{ name: string }>((store, defaultId) => {
  store.set({ id: defaultId, name: 'User' })
  // THROWS Property 'notAThing' does not exist
  store.notAThing
})

console.log(id, builtId, cachedId)
