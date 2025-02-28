import { getKey } from '.'
import { atom } from '../atom'
import { map } from '../map'

let $store = map({
  user: {
    name: 'John'
  }
})

let $store2 = atom('john')

let $store3 = atom({
  user: {
    name: 'John'
  }
})
// THROWS Argument of type '"user.nejm"' is not assignable to parameter of type '"user" | "user.name"'.
let throws = getKey($store, 'user.nejm')

// THROWS Argument of type '"user[0]"' is not assignable to parameter of type '"user" | "user.name"'.
let throws1 = getKey($store, 'user[0]')

// THROWS Argument of type '"usser"' is not assignable to parameter of type '"user" | "user.name"'.
let throws2 = getKey($store, 'usser')

// THROWS Argument of type 'PreinitializedWritableAtom<string> & object' is not assignable to parameter of type 'AnyStore<Record<string, unknown>>'.
let throws3 = getKey($store2, 'john')

let works = getKey($store3, 'user.name')
