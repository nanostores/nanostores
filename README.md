# Logux State

<img align="right" width="95" height="148" title="Logux logotype"
     src="https://logux.io/branding/logotype.svg">

A tiny state manager for **React**, **Preact**, **Vue** and **Svelte**.
It uses **many atomic stores** and direct manipulation.

* **Small.** 157 bytes (minified and gzipped). Zero dependencies.
  It uses [Size Limit] to control size.
* **Fast.** With small atomic and derived stores, you do not need to call
  the selector function for all components on every store change.
* **Tree Shakable.** The chunk contains only stores used by components
  in the chunk.
* **Lazy.** Store does not use CPU or memory until you render components
  subscribed to this store.
* Was designed to move logic from components to stores. Already has **router**
  and **persistent** stores.
* It has good **TypeScript** support.

```ts
// store/users.ts
import { createStore, getValue } from '@logux/state'

export const users = createStore<User[]>(() => {
  users.set([])
})

export function addUser(user: User) {
  users.set([...getValue(users), user])
}
```

```ts
// store/admins.ts
import { createDerived } from '@logux/state'
import { users } from './users.js'

export const admins = createDerived(users, list =>
  list.filter(user => user.isAdmin)
)
```

```tsx
// components/admins.tsx
import { useStore } from '@logux/state/react'
import { admins } from '../stores/admins.js'

export const Admins = () => {
  const list = useStore(admins)
  return (
    <ul>
      {list.map(user => <UserItem user={user} />)}
    </ul>
  )
}
```

It is part of [Logux](https://logux.io/) project,
but can be used without any other Logux parts.


<a href="https://evilmartians.com/?utm_source=logux-client">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>

[Size Limit]: https://github.com/ai/size-limit
[Logux]:      https://logux.io/


## Install

```sh
npm install @logux/state
```

## Tools

* [Persistent] store to save data to `localStorage`.
* [Router](#router) store.
* [Logux Client](https://github.com/logux/client): stores with WebSocket
  sync and CRDT conflict resolution.


## Stores

In Logux State stores are **smart**. They subscribe to events,
validate input, send AJAX requests, etc. For instance,
build-in [Router](#Router) store subscribes to click on `<a>`
and `window.onpopstate`. It simplify testing and switching
between UI frameworks.

```ts
import { createStore } from '@logux/state'

export type StoreType = …

export const simpleStore = createStore<StoreType>(() => {
  simpleStore.set(initialValue)
  // initializer: subscribe to events
  return () => {
    // destructor: unsubscribe from all events
  }
})
```

Stores have two modes: **active** and **disabled**. By default,
store is in disabled mode and do not keep value. On the first subscriber,
store will call initializer and will move to active mode. 1 second after
unsubscribing of the last listener, store will call destructor
and remove store’s value from the memory.

The only way to get store’s value is to subscribe to store’s changes:

```ts
const unsubscribe2 = store.listen(value => {
  // Call listener on store changes
})

const unsubscribe1 = store.subscribe(value => {
  // Call listener immediately after subscribing and then on any changes
})
```

By we have shortcut to subscribe, return value and unsubscribe:

```ts
import { getValue } from '@logux/store'

getValue(store) //=> store’s value
```


### Simple Store

Simple store API is basement for all other stores.

```ts
import { createStore, getValue } from '@logux/state'

export const counter = createStore<number>(() => {
  counter.set(0)
})

export function increaseCounter() {
  counter.set(getValue(counter) + 1)
}
```

You can change store value by calling `store.set(newValue)` method.


### Map Store

This store with key-value pairs.

```ts
import { createMap } from '@logux/state`

export interface ProfileValue {
  name: string,
  email?: string
}

export const profile = createMap<ProfileValue>(() => {
  profile.setKey('name', 'anonymous')
})
```

In additional to `store.set(newObject)` it has `store.setKey(key, value)`
to change specific key.

Changes listener receives changed key as a second argument.

```ts
profile.listen((value, changed) => {
  console.log(`${changed} new value ${value[changed]}`)
})
```

Map store object link is the same. `store.set(newObject)` changes all keys
inside the old object.


### Derived Store

The store based on other store’s value.

```ts
import { createDerived } from '@logux/state'

import { users } from './users.js'

export const admins = createDerived(users, all => {
  // This callback will be called on every `users` changes
  return all.filter(user => user.isAdmin)
})
```

You can combine a value from multiple stores:

```ts
import { lastVisit } from './lastVisit.js'
import { posts } from './posts.js'

export const newPosts = createDerived([lastVisit, posts], (when, allPosts) => {
  return allPosts.filter(post => post.publishedAt > when)
})
```


### Store Builder

A template to create similar store. Each store made by template
is map store with at least `id` key.

```ts
import { defineMap, BuilderStore } from '@logux/state'

export interface PostValue {
  id: string
  title: string
  updatedAt: number
}

export const Post = defineMap<PostValue>((newPost, id) => {
  newPost.setKey('title', 'New post')
  newPost.setKey('updatedAt', Date.now())
  // initializer: subscribe to events
  return () => {
    // destructor: unsubscribe from all events
  }
})

export function renamePost (post: BuilderStore<typeof Post>, newTitle: string) {
  post.setKey('title', newTitle)
  post.setKey('updatedAt', Date.now())
}
```

Builder is a function, which return a new store instance.

```ts
import { Post } from '../stores/post.js'

const post = Post(id)
```

If store has listeners, builder will return old post instance
on the same store’s ID.

```ts
Post('same ID') === Post('same ID')
```


## Best Practices

### Move Logic from Components to Stores

Stores is not only to keep values. You can use them to track time, to load data
from server.

```ts
import { createStore } from '@logux/state'

export const currentTime = createStore<number>(() => {
  currentTime.set(Date.now())
  const updating = setInterval(() => {
    currentTime.set(Date.now())
  }, 1000)
  return () => {
    clearInterval(updating)
  }
})
```

Use derived stores to create chains of reactive computations.

```ts
import { createDerived } from '@logux/state'

import { currentTime } from './currentTime.js'

const appStarted = Date.now()

export const userInApp = createDerived(currentTime, now => {
  return now - appStarted
})
```

We recommend to move all logic, which is not highly related to UI to the stores.
Let your stores track URL routing, validation, sending data to server.

With application logic in the stores it’s much easy to write and run tests.
It is also easy to change your UI framework. For instance, add React Native
version of application.


## Be Prepared for Value Loss on No Listeners

Store has value only in active state. In disabled mode, store will free memory
by removing store’s value.

```ts
const unbind = user.listen(() => {
  …
})
renameUser(user, 'New name')
getValue(user) //=> { id: '1', name: 'New name' }

unbind()
await delay(1000)
getValue(user) //=> { id: '1', name: 'Initial name' }
```

Save value to persistence storage or always keep one listener for store:

```ts
import { keepActive } from '@logux/state'

keepActive(profile) // profile.listen(() => {})
```


### Think about Tree Shaking

We recommend to do all store changes in separated functions. It will allow
to tree shake unused functions from JS bundle.

```ts
export function changeStore (newValue: string) {
  if (validate(newValue)) {
    throw new Error('New value is not valid')
  } else {
    store.set(newValue)
  }
}
```

For builder you can add properties to store, but try to avoid it:

```ts
interface UserExt = {
  avatarCache?: string
}

export function User = defineMap<UserValue, [], UserExt>((store, id) => {
  …
})

function getAvatar (user: BuilderStore<typeof User>) {
  if (!user.avatarCache) {
    user.avatarCache = generateAvatar(getValue(user).email)
  }
  return user.avatarCache
}
```


## Integration

### React & Preact

Use `useStore()` hook to get store’s value and re-render component
on store’s changes.

```tsx
import { useStore } from '@logux/state/react' // or '@logux/state/preact'

import { profile } from '../stores/profile.js'
import { User } from '../stores/user.js'

export const Header = () => {
  const profile = useStore(profile)
  const currentUser = useStore(User(profile.userId))
  return <header>${currentUser.name}<header>
}
```

### Vue

Use `useStore()` hook to get store’s value and re-render component
on store’s changes.

```vue
<template>
  <header>{{ name }}</header>
</template>

<script>
  import { useStore } from '@logux/state/vue'

  import { profile } from '../stores/profile.js'
  import { User } from '../stores/user.js'

  export default () => {
    const profile = useStore(profile)
    const currentUser = useStore(User(profile.userId))
    return { name: currentUser.name }
  }
</script>
```

### Svelte

Every store implements
[Svelte store contract](https://svelte.dev/docs#Store_contract).
Put `$` before store variable to get store’s
value and subscribe for store’s changes.

```svelte
<script>
  import { profile } from '../stores/profile.js'
  import { User } from '../stores/user.js'

  const profile = useStore(profile)
  const currentUser = useStore(User(profile.userId))
</script>

<header>{$currentUser.name}</header>
```


### Tests

Adding empty listener by `keepActive(store)` keeps store in active mode during
the test. `cleanStores(store1, store2, …)` cleans stores used in the test.

```ts
import { getValue, cleanStores, keepActive } from '@logux/state'

import { profile } from './profile.js'

afterEach(() => {
  cleanStores(profile)
})

it('is anonymous from the beginning', () => {
  keepActive(profile)
  expect(getValue(profile)).toEqual({ name: 'anonymous' })
})
```


## Build-in Stores

### Persistent

`TODO`

### Router

`TODO`
