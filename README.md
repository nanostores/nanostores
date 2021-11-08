# Nano Stores

<img align="right" width="92" height="92" title="Nano Stores logo"
     src="https://nanostores.github.io/nanostores/logo.svg">

A tiny state manager for **React**, **React Native**, **Preact**, **Vue**,
**Svelte**, and vanilla JS. It uses **many atomic stores**
and direct manipulation.

* **Small.** Between 198 and 951 bytes (minified and gzipped).
  Zero dependencies. It uses [Size Limit] to control size.
* **Fast.** With small atomic and derived stores, you do not need to call
  the selector function for all components on every store change.
* **Tree Shakable.** The chunk contains only stores used by components
  in the chunk.
* Was designed to move logic from components to stores.
* It has good **TypeScript** support.

```ts
// store/users.ts
import { atom, update } from 'nanostores'

export const users = atom<User[]>([])

export function addUser(user: User) {
  update(users, current => [...current, user])
}
```

```ts
// store/admins.ts
import { computed } from 'nanostores'
import { users } from './users.js'

export const admins = computed(users, list =>
  list.filter(user => user.isAdmin)
)
```

```tsx
// components/admins.tsx
import { useStore } from '@nanostores/react'
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

[Size Limit]: https://github.com/ai/size-limit

## Table of Contents

* [Tools](#tools)
* [Guide](#guide)
* Integration
  * [React & Preact](#react--preact)
  * [Next.js](#nextjs)
  * [Vue](#vue)
  * [Svelte](#svelte)
  * [Vanilla JS](#vanilla-js)
  * [Server-Side Rendering](#server-side-rendering)
  * [Tests](#tests)
* [Best Practices](#best-practices)
* [Known Issues](#known-issues)


## Install

```sh
npm install nanostores
```

## Tools

* [Persistent](https://github.com/nanostores/persistent) store to save data
  to `localStorage` and synchronize changes between browser tabs.
* [Router](https://github.com/nanostores/router) store to parse URL
  and implements SPA navigation.
* [I18n](https://github.com/nanostores/i18n) library based on stores
  to make application translatable.
* [Logux Client](https://github.com/logux/client): stores with WebSocket
  sync and CRDT conflict resolution.


## Guide

### Atoms

Atom store can be used to store strings, numbers, arrays.

You can use it for objects too if you want to prohibit key changes
and allow only replacing the whole object (like we do in [router]).

To create it call `atom(initial)` and pass initial value as a first argument.

```ts
import { atom } from 'nanostores'

export const counter = atom(0)
```

In TypeScript, you can optionally pass value type as type parameter.

```ts
export type LoadingStateValue = 'empty' | 'loading' | 'loaded'
export const loadingState = atom<LoadingStateValue>('empty')
```

`store.get()` will return store’s current value.
`store.set(nextValue)` will change value.

```ts
counter.set(counter.get() + 1)
```

`store.subscribe(cb)` and `store.listen(cb)` can be used to subscribe
for the changes in vanilla JS. For React/Vue we have extra special helpers
to re-render the component on any store changes.

```ts
const unbindListener = counter.subscribe(value => {
  console.log('counter value:', value)
})
```

`store.subscribe(cb)` in contrast with `store.listen(cb)` also call listeners
imminently during the subscription.

[router]: https://github.com/nanostores/router


### Maps

Map store can be used to store objects and change keys in this object.

To create map store call `map(initial)` function with initial object.

```ts
import { map } from 'nanostores'

export const profile = map({
  name: 'anonymous'
})
```

In TypeScript you can pass type parameter with store’s type:

```ts
export interface ProfileValue {
  name: string,
  email?: string
}

export const profile = map<ProfileValue>({
  name: 'anonymous'
})
```

`store.set(object)` or `store.setKey(key, value)` methods will change the store.

```ts
profile.setKey('name', 'Kazimir Malevich')
```

Store’s listeners will receive second argument with change key.

```ts
profile.listen((value, changed) => {
  console.log(`${changed} new value ${value[changed]}`)
})
```

You can use `store.notify()` to trigger listeners without changing value
in the key for performance reasons.

```ts
store.get().bigList.push(newItem)
store.notify('bigList')
```


### Maps Templates

Map templates was created for similar stores like for the store
for each post in the blog where you have many posts.

Other state managers uses a single store `postsList` with an array.
Nano Stores recommends to use a separated store for each item because of:

1. Performance: components can subscribe to the changes on specific post.
2. Lists can’t reflect that only specific subset of posts was loaded
   from the server.

`mapTemplate(init)` creates template. `init` callback will receive item’s
store and ID.

```ts
import { mapTemplate } from 'nanostores'

export interface PostValue {
  id: string
  title: string
  updatedAt: number
}

export const Post = mapTemplate<PostValue>((newPost, id) => {
  newPost.setKey('title', 'New post')
  newPost.setKey('updatedAt', Date.now())
})
```

Each item of the template must to have `value.id`.

```ts
let post1 = Post('1')
post.get().id //=> '1'
```


### Lazy Stores

Nano Stores unique feature is that every state have 2 modes:

* **Mount:** when one or more listeners was mount to the store.
* **Disabled:** when store has no listeners.

Nano Stores was created to move logic from components to the store.
Stores can listen URL changes or establish network connections.
Mount/disabled modes allow you to create lazy stores, which will use resources
only if store is really used in the UI.

`onMount` sets callback for mount and disabled states.

```ts
import { onMount } from 'nanostores'

onMount(profile, () => {
  // Mount mode
  return () => {
    // Disabled mode
  }
})
```

For performance reasons, store will move to disabled mode with 1 second delay
after last listener unsubscribing.

Map templates can use `init` callback for code for mount and disabled modes:

```ts
mapTemplate((post, id) => {
  // Mount mode
  let unsubscribe = loadDataAndSubscribe(`/posts/${id}`, data => {
    post.set(data)
  })
  return () => {
    // Disabled mode
    unsubscribe()
  }
})
```

Map template will keep cache of all mount stores:

```ts
postA = Post('same ID')
postB = Post('same ID')
postA === postB //=> true
```

### Computed Stores

Computed store is based on other store’s value.

```ts
import { computed } from 'nanostores'

import { users } from './users.js'

export const admins = computed(users, all => {
  // This callback will be called on every `users` changes
  return all.filter(user => user.isAdmin)
})
```

You can combine a value from multiple stores:

```ts
import { lastVisit } from './lastVisit.js'
import { posts } from './posts.js'

export const newPosts = computed([lastVisit, posts], (when, allPosts) => {
  return allPosts.filter(post => post.publishedAt > when)
})
```

### Actions

Action is a function that change . It is a good place to move
business logic like validation or network operations.

Wrapping functions with `action()` can track who changed the store
in the log and DevTools.

```ts
import { action } from 'nanostores'

export const increase = action(counter, 'increase', (store, add) => {
  if (validateMax(store.get() + add)) {
    store.set(store.get() + add)
  }
  return store.get()
})

increase(1) //=> 1
increase(5) //=> 6
```

Actions for map template can be created with `actionFor()`:

```ts
import { actionFor } from 'nanostores'

export const rename = actionFor(Post, 'rename', async (store, newTitle) => {
  await api.updatePost({
    id: store.get().id,
    title: newTitle
  })
  store.setKey('title', newTitle)
  store.setKey('updatedAt', Date.now())
})

await rename(post, 'New title')
```

All running async actions are tracked by `allTasks()`. It can simplify
tests with chains of actions.

```ts
import { allTasks } from 'nanostores'

renameAllPosts()
await allTasks()
```

### Tasks

`startTask()` and `task()` can be used to mark all async operations
during store initialization.

```ts
import { task } from 'nanostores'

onMount(post, () => {
  task(async () => {
    post.set(await loadPost())
  })
})
```

You can wait for all ongoing tasks end in tests or SSR with `await allTasks()`.

```ts
import { allTasks } from 'nanostores'

post.listen(() => {}) // Move store to active mode to start data loading
await allTasks()

const html = ReactDOMServer.renderToString(<App />)
```

Async actions will be wrapped to `task()` automatically.

```ts
rename(post1, 'New title')
rename(post2, 'New title')
await allTasks()
```


### Store Events

Each store has a few events, which you listen:

* `onStart(store, cb)`: first listener was subscribed.
* `onStop(store, cb)`: last listener was unsubscribed.
* `onMount(store, cb)`: shortcut to use both `onStart` and `onStop`.
* `onSet(store, cb)`: before applying any changes to the store.
* `onNotify(store, cb)`: before notifying store’s listeners about changes.
* `onAction(store, cb)`: start, end and errors of asynchronous actions.

`onSet` and `onNotify` events has `abort()` function to prevent changes
or notification.

```ts
import { onSet } from 'nanostores'

onSet(store, ({ newValue, abort }) => {
  if (!validate(newValue)) {
    abort()
  }
})
```

`onAction` event has two event handlers as properties inside:
`onError` that catches uncaught errors during the execution of actions
and `onEnd` after events has been resolved or rejected.

```ts
import { onAction } from 'nanostores'

onAction(store, ({ id, actionName, onError, onEnd }) => {
  console.log(`Action ${actionName} was started`)
  onError(({ error }) => {
    console.error(`Action ${actionName} was failed`, error)
  })
  onEnd(() => {
    console.log(`Action ${actionName} was stopped`)
  })
})
```

Event listeners can communicate with `payload.shared` object.


## Integration

### React & Preact

Use [`@nanostores/react`] or [`@nanostores/preact`] package
and `useStore()` hook to get store’s value and re-render component
on store’s changes.

```tsx
import { useStore } from '@nanostores/react' // or '@nanostores/preact'

import { profile } from '../stores/profile.js'
import { Post } from '../stores/post.js'

export const Header = ({ postId }) => {
  const user = useStore(profile)
  const post = useStore(Post(postId))
  return <header>{post.title} for {user.name}</header>
}
```

[`@nanostores/preact`]: https://github.com/nanostores/preact
[`@nanostores/react`]: https://github.com/nanostores/react


### Vue

Use [`@nanostores/vue`] and `useStore()` composable function
to get store’s value and re-render component on store’s changes.

```vue
<template>
  <header>{{ post.title }} for {{ user.name }}</header>
</template>

<script>
  import { useStore } from '@nanostores/vue'

  import { profile } from '../stores/profile.js'
  import { Post } from '../stores/post.js'

  export default {
    setup (props) {
      const user = useStore(profile)
      const post = useStore(Post(props.postId))
      return { user, post }
    }
  }
</script>
```

[`@nanostores/vue`]: https://github.com/nanostores/vue


### Svelte

Every store implements
[Svelte store contract](https://svelte.dev/docs#Store_contract).
Put `$` before store variable to get store’s
value and subscribe for store’s changes.

```svelte
<script>
  import { profile } from '../stores/profile.js'
  import { Post } from '../stores/post.js'

  export let postId

  const post = Post(postId)
</script>

<header>{$post.title} for {$profile.name}</header>
```


### Vanilla JS

`Store#subscribe()` calls callback immediately and subscribes to store changes.
It passes store’s value to callback.

```js
import { profile } from '../stores/profile.js'
import { Post } from '../stores/post.js'

const post = Post(postId)

function render () {
  console.log(`${post.title} for ${profile.name}`)
}

profile.listen(render)
post.listen(render)
render()
```

See also `listenKeys(store, keys, cb)` to listen for specific keys changes
in the map.


### Server-Side Rendering

Nano Stores support SSR. Use standard strategies.

```js
if (isServer) {
  settings.set(initialSettings)
  router.open(renderingPageURL)
}
```

You can wait for async operations (for instance, data loading
via isomorphic `fetch()`) before rendering the page:

```jsx
import { allTasks } from 'nanostores'

post.listen(() => {}) // Move store to active mode to start data loading
await allTasks()

const html = ReactDOMServer.renderToString(<App />)
```


### Tests

Adding an empty listener by `keepMount(store)` keeps the store
in active mode during the test. `cleanStores(store1, store2, …)` cleans
stores used in the test.

```ts
import { cleanStores, keepMount } from 'nanostores'
import { profile } from './profile.js'

afterEach(() => {
  cleanStores(profile)
})

it('is anonymous from the beginning', () => {
  keepMount(profile)
  expect(profile.get()).toEqual({ name: 'anonymous' })
})
```

You can use `allTasks()` to wait all async operations in stores.

```ts
import { allTasks } from 'nanostores'

it('saves user', async () => {
  saveUser()
  await allTasks()
  expect(analyticsEvents.get()).toEqual(['user:save'])
})
```


## Best Practices

### Move Logic from Components to Stores

Stores are not only to keep values. You can use them to track time, to load data
from server.

```ts
import { atom, onMount } from 'nanostores'

export const currentTime = atom<number>(Date.now())

onMount(currentTime, () => {
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
import { computed } from 'nanostores'
import { currentTime } from './currentTime.js'

const appStarted = Date.now()

export const userInApp = computed(currentTime, now => {
  return now - appStarted
})
```

We recommend moving all logic, which is not highly related to UI, to the stores.
Let your stores track URL routing, validation, sending data to a server.

With application logic in the stores, it is much easier to write and run tests.
It is also easy to change your UI framework. For instance, add React Native
version of the application.


### Separate changes and reaction

Use a separated listener to react on new store’s value, not an action where you
change this store.

```diff
  const increase = action(counter, 'increase', store => {
    store.set(store.get() + 1)
-   printCounter(store.get())
  }

+ counter.listen(value => {
+   printCounter(value)
+ })
```

A actions is not only a way for store to a get new value.
For instance, persistent store could get the new value from another browser tab.

With this separation your UI will be ready to any source of store’s changes.


### Reduce `get()` usage outside of tests

`get()` returns current value and it is a good solution for tests.

But it is better to use `useStore()`, `$store`, or `Store#subscribe()` in UI
to subscribe to store changes and always render the actual data.

```diff
- const { userId } = profile.get()
+ const { userId } = useStore(profile)
```


## Known Issues

### ESM

Nano Stores use ESM-only package. You need to use ES modules
in your application to import Nano Stores.

In Next.js ≥11.1 you can alternatively use the [`esmExternals`] config option.

For old Next.js you need to use [`next-transpile-modules`] to fix
lack of ESM support in Next.js.

[`next-transpile-modules`]: https://www.npmjs.com/package/next-transpile-modules
[`esmExternals`]: https://nextjs.org/blog/next-11-1#es-modules-support
