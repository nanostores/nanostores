# Nano Stores

<img align="right" width="95" height="148" title="Logux logotype"
     src="https://logux.io/branding/logotype.svg">

A tiny state manager for **React**, **Preact**, **Vue**, **Svelte**,
and vanilla JS. It uses **many atomic stores** and direct manipulation.

* **Small.** between 152 and 459 bytes (minified and gzipped).
  Zero dependencies. It uses [Size Limit] to control size.
* **Fast.** With small atomic and derived stores, you do not need to call
  the selector function for all components on every store change.
* **Tree Shakable.** The chunk contains only stores used by components
  in the chunk.
* Was designed to move logic from components to stores. Already has **router**
  and **persistent** stores.
* It has good **TypeScript** support.

```ts
// store/users.ts
import { createStore, update } from 'nanostores'

export const users = createStore<User[]>(() => {
  users.set([])
})

export function addUser(user: User) {
  update(users, current => [...current, user])
}
```

```ts
// store/admins.ts
import { createDerived } from 'nanostores'

import { users } from './users.js'

export const admins = createDerived(users, list =>
  list.filter(user => user.isAdmin)
)
```

```tsx
// components/admins.tsx
import { useStore } from 'nanostores/react'

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

<a href="https://evilmartians.com/?utm_source=nanostores">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>

[Size Limit]: https://github.com/ai/size-limit
[Logux]:      https://logux.io/

## Table of Contents

* [Tools](#tools)
* [Guide](#guide)
* Integration
  * [React & Preact](#react--preact)
  * [Vue](#vue)
  * [Svelte](#svelte)
  * [Vanilla JS](#vanilla-js)
  * [Tests](#tests)
* [Best Practices](#best-practices)
* Build-in Stores
  * [Persistent](#persistent)
  * [Router](#router)


## Install

```sh
npm install nanostores
```

## Tools

* [Persistent](#persistent) store to save data to `localStorage`.
* [Router](#router) store.
* [Logux Client](https://github.com/logux/client): stores with WebSocket
  sync and CRDT conflict resolution.


## Guide

In Nano Stores, stores are **smart**. They subscribe to events,
validate input, send AJAX requests, etc. For instance,
build-in [Router](#Router) store subscribes to click on `<a>`
and `window.onpopstate`. It simplifies testing and switching
between UI frameworks (like from React to React Native).

```ts
import { createStore } from 'nanostores'

export type StoreType = …

export const simpleStore = createStore<StoreType>(() => {
  simpleStore.set(initialValue)
  // initializer: subscribe to events
  return () => {
    // destructor: unsubscribe from all events
  }
})
```

Stores have two modes: **active** and **disabled**. From the beginning,
the store is in disabled mode and does not keep value. On the first subscriber,
the store will call the initializer and will move to active mode.
One second after unsubscribing of the last listener, the store will call
the destructor.

The only way to get store’s value is to subscribe to store’s changes:

```ts
const unsubscribe2 = store.listen(value => {
  // Call listener on store changes
})

const unsubscribe1 = store.subscribe(value => {
  // Call listener immediately after subscribing and then on any changes
})
```

We have shortcut to subscribe, return value and unsubscribe:

```ts
import { getValue } from 'nanostores'

getValue(store) //=> store’s value
```

And there is shortcut to get current value, change it and set new value.

```ts
import { update } from 'nanostores'

update(store, value => newValue)
```


### Simple Store

Simple store API is the basement for all other stores.

```ts
import { createStore, update } from 'nanostores'

export const counter = createStore<number>(() => {
  counter.set(0)
})

export function increaseCounter() {
  update(counter, value => value + 1)
}
```

You can change store value by calling the `store.set(newValue)` method.


### Map Store

This store with key-value pairs.

```ts
import { createMap } from 'nanostores'

export interface ProfileValue {
  name: string,
  email?: string
}

export const profile = createMap<ProfileValue>(() => {
  profile.setKey('name', 'anonymous')
})
```

In additional to `store.set(newObject)` it has `store.setKey(key, value)`
to change specific key. There is a special shortcut
`updateKey(store, key, updater)` in additional to `update(store, updater)`.

Changes listener receives changed key as a second argument.

```ts
profile.listen((value, changed) => {
  console.log(`${changed} new value ${value[changed]}`)
})
```

Map store object link is the same. `store.set(newObject)` changes all keys
inside the old object.


### Derived Store

The store is based on other store’s value.

```ts
import { createDerived } from 'nanostores'

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

A template to create a similar store. Each store made by the template
is map store with at least the `id` key.

```ts
import { defineMap, BuilderStore } from 'nanostores'

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

Builder is a function, which returns a new store instance.

```ts
import { Post } from '../stores/post.js'

const post = Post(id)
```

If a store has listeners, the builder will return the old post instance
on the same store’s ID.

```ts
Post('same ID') === Post('same ID')
```


## Integration

### React & Preact

Use `useStore()` hook to get store’s value and re-render component
on store’s changes.

```tsx
import { useStore } from 'nanostores/react' // or 'nanostores/preact'

import { profile } from '../stores/profile.js'
import { User } from '../stores/user.js'

export const Header = () => {
  const { userId } = useStore(profile)
  const currentUser = useStore(User(userId))
  return <header>${currentUser.name}<header>
}
```


### Vue

Use `useStore()` composable function to get store’s value
and re-render component on store’s changes.

```vue
<template>
  <header>{{ currentUser.name }}</header>
</template>

<script>
  import { useStore } from 'nanostores/vue'

  import { profile } from '../stores/profile.js'
  import { User } from '../stores/user.js'

  export default {
    setup () {
      const { userId } = useStore(profile).value
      const currentUser = useStore(User(userId))
      return { currentUser }
    }
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

  const { userId } = useStore(profile)
  const currentUser = useStore(User(userId))
</script>

<header>{$currentUser.name}</header>
```


### Vanilla JS

`Store#subscribe()` calls callback immediately and subscribes to store changes.
It passes store’s value to callback.

```js
let prevUserUnbind
profile.subscribe(({ userId }) => {
  // Re-subscribe on current user ID changes
  if (prevUserUnbind) {
    // Remove old user listener
    prevUserUnbind()
  }
  // Add new user listener
  prevUserUnbind = User(userId).subscribe(currentUser => {
    console.log(currentUser.name)
  })
})
```

Use `Store#listen()` if you need to add listener without calling
callback immediately.


### Tests

Adding an empty listener by `keepActive(store)` keeps the store
in active mode during the test. `cleanStores(store1, store2, …)` cleans
stores used in the test.

```ts
import { getValue, cleanStores, keepActive } from 'nanostores'

import { profile } from './profile.js'

afterEach(() => {
  cleanStores(profile)
})

it('is anonymous from the beginning', () => {
  keepActive(profile)
  expect(getValue(profile)).toEqual({ name: 'anonymous' })
})
```


## Best Practices

### Move Logic from Components to Stores

Stores are not only to keep values. You can use them to track time, to load data
from server.

```ts
import { createStore } from 'nanostores'

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
import { createDerived } from 'nanostores'

import { currentTime } from './currentTime.js'

const appStarted = Date.now()

export const userInApp = createDerived(currentTime, now => {
  return now - appStarted
})
```

We recommend moving all logic, which is not highly related to UI to the stores.
Let your stores track URL routing, validation, sending data to a server.

With application logic in the stores, it’s much easy to write and run tests.
It is also easy to change your UI framework. For instance, add React Native
version of the application.


### Think about Tree Shaking

We recommend doing all store changes in separated functions. It will allow
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

For builder, you can add properties to the store, but try to avoid it.

```ts
interface UserExt {
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

### Separate changes and reaction

Use separated listener to react on new store’s value, not a function where you
change this store.

```diff
  function increase () {
    update(counter, value => value + 1)
-   printCounter(getValue(counter))
  }

+ counter.subscribe(value => {
+   printCounter(value)
+ })
```

Change functions are often not only way for store to get new value.
For instance, persistent store could get new value from another browser tab.

With this separation your UI will be ready to any source of store’s changes.


### Reduce `getValue()` usage outside of tests

`getValue()` returns current value and it is a good solution for tests.

But it is better to use `useStore()`, `$store`, or `Store#subscribe()` in UI
to subscribe to store changes and always render the actual data.

```diff
- const { userId } = getValue(profile)
+ const { userId } = useStore(profile)
```

In change function you can use `update` and `updateKey` shortcuts:

```diff
  function increase () {
-   counter.set(getValue(counter) + 1)
+   update(counter, value => value + 1)
  }
```


## Build-in Stores

### Persistent

You can create a store to keep value with some prefix in `localStorage`.

```ts
import { createPersistent } from 'nanostores'

export interface CartValue {
  list: string[]
}

export const shoppingCart = createPersistent<CartValue>({ list: [] }, 'cart')
```

This store also listen for keys changes in `localStorage` and can be used
to synchronize changes between browser tabs.


### Router

Since we promote moving logic to store, the router is a good part
of the application to be moved from UI framework like React.

```ts
import { createRouter } from 'nanostores'

// Types for :params in route templates
interface Routes {
  home: void
  category: 'categoryId'
  post: 'categoryId' | 'id'
}

export const router = createRouter<Routes>({
  home: '/',
  category: '/posts/:categoryId',
  post: '/posts/:categoryId/:id'
})
```

Store in active mode listen for `<a>` clicks on `document.body` and Back button
in browser.

You can use `getPagePath()` to avoid hard coding URL to a template. It is better
to use the router as a single place of truth.

```tsx
import { getPagePath } from 'nanostores'

…
  <a href={getPagePath(router, 'post', { categoryId: 'guides', id: '10' })}>
```

If you need to change URL programmatically you can use `openPage`
or `replacePage`:

```ts
import { openPage, replacePage } from 'nanostores'

function requireLogin () {
  openPage(router, 'login')
}

function onLoginSuccess() {
  // Replace login route, so we don’t face it on back navigation
  replacePage(router, 'home')
}
```
