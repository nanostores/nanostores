# Nano Stores

<img align="right" width="92" height="92" title="Nano Stores logo"
     src="https://nanostores.github.io/nanostores/logo.svg">

A tiny state manager for **React**, **React Native**, **Preact**, **Vue**,
**Svelte**, **Solid**, **Lit**, **Angular**, and vanilla JS.
It uses **many atomic stores** and direct manipulation.

* **Small.** Between 265 and 803 bytes (minified and brotlied).
  Zero dependencies. It uses [Size Limit] to control size.
* **Fast.** With small atomic and derived stores, you do not need to call
  the selector function for all components on every store change.
* **Tree Shakable.** A chunk contains only stores used by components
  in the chunk.
* Designed to move logic from components to stores.
* Good **TypeScript** support.

```ts
// store/users.ts
import { atom } from 'nanostores'

export const $users = atom<User[]>([])

export function addUser(user: User) {
  $users.set([...$users.get(), user]);
}
```

```ts
// store/admins.ts
import { computed } from 'nanostores'
import { $users } from './users.ts'

export const $admins = computed($users, users => users.filter(i => i.isAdmin))
```

```tsx
// components/admins.tsx
import { useStore } from '@nanostores/react'
import { $admins } from '../stores/admins.ts'

export const Admins = () => {
  const admins = useStore($admins)
  return (
    <ul>
      {admins.map(user => <UserItem user={user} />)}
    </ul>
  )
}
```

---

<img src="https://cdn.evilmartians.com/badges/logo-no-label.svg" alt="" width="22" height="16" />  Made at <b><a href="https://evilmartians.com/devtools?utm_source=nanostores&utm_campaign=devtools-button&utm_medium=github">Evil Martians</a></b>, product consulting for <b>developer tools</b>.

---

[Size Limit]: https://github.com/ai/size-limit


## Table of Contents

- [Table of Contents](#table-of-contents)
- [Install](#install)
- [Smart Stores](#smart-stores)
- [Devtools](#devtools)
- [Guide](#guide)
  - [Atoms](#atoms)
  - [Maps](#maps)
  - [Deep Maps](#deep-maps)
  - [Lazy Stores](#lazy-stores)
  - [Computed Stores](#computed-stores)
  - [Effects](#effects)
  - [Map Creator](#map-creator)
  - [Tasks](#tasks)
  - [Store Events](#store-events)
- [Integration](#integration)
  - [React \& Preact](#react--preact)
  - [Vue](#vue)
  - [Svelte](#svelte)
  - [Solid](#solid)
  - [Lit](#lit)
  - [Angular](#angular)
  - [Vanilla JS](#vanilla-js)
  - [Server-Side Rendering](#server-side-rendering)
  - [Tests](#tests)
- [Best Practices](#best-practices)
  - [Move Logic from Components to Stores](#move-logic-from-components-to-stores)
  - [Separate changes and reaction](#separate-changes-and-reaction)
  - [Reduce `get()` usage outside of tests](#reduce-get-usage-outside-of-tests)
- [Known Issues](#known-issues)
  - [ESM](#esm)


## Install

```sh
npm install nanostores
```


## Smart Stores

* [Persistent](https://github.com/nanostores/persistent) store to save data
  to `localStorage` and synchronize changes between browser tabs.
* [Router](https://github.com/nanostores/router) store to parse URL
  and implements SPA navigation.
* [I18n](https://github.com/nanostores/i18n) library based on stores
  to make application translatable.
* [Query](https://github.com/nanostores/query) store that helps you with smart
  remote data fetching.
* [Logux Client](https://github.com/logux/client): stores with WebSocket
  sync and CRDT conflict resolution.
* [Immer](https://github.com/illuxiza/nanostores-immer) plugin to
  enable immutable state updates using Immer.
* [qs](https://github.com/VdustR/nanostores-qs) manage the query string in the URL.


## Devtools

* [Logger](https://github.com/nanostores/logger) of lifecycle, changes
  in the browser console.
* [Vue Devtools](https://github.com/nanostores/vue#devtools) plugin that detects
  stores and attaches them to devtools inspectors and timeline.


## Guide

### Atoms

Atom store can be used to store strings, numbers, arrays.

You can use it for objects too if you want to prohibit key changes
and allow only replacing the whole object (like we do in [router]).

To create it call `atom(initial)` and pass initial value as a first argument.

```ts
import { atom } from 'nanostores'

export const $counter = atom(0)
```

In TypeScript, you can optionally pass value type as type parameter.

```ts
export type LoadingStateValue = 'empty' | 'loading' | 'loaded'

export const $loadingState = atom<LoadingStateValue>('empty')
```

Then you can use `StoreValue<Store>` helper to get store’s value type
in TypeScript:

```ts
import type { StoreValue } from 'nanostores'

type Value = StoreValue<typeof $loadingState> //=> LoadingStateValue
```

`store.get()` will return store’s current value.
`store.set(nextValue)` will change value.

```ts
$counter.set($counter.get() + 1)
```

`store.subscribe(cb)` and `store.listen(cb)` can be used to subscribe
for the changes in vanilla JS. For [React](#react--preact)/[Vue](#vue)
we have extra special helpers `useStore` to re-render the component on
any store changes.

Listener callbacks will receive the updated value as a first argument
and the previous value as a second argument.

```ts
const unbindListener = $counter.subscribe((value, oldValue) => {
  console.log(`counter value changed from ${oldValue} to ${value}`)
})
```

`store.subscribe(cb)` in contrast with `store.listen(cb)` also call listeners
immediately during the subscription.
Note that the initial call for `store.subscribe(cb)` will not have any
previous value and `oldValue` will be `undefined`.

See also [`effect()`](#effects) if you want to subscribe to multiple stores.

[router]: https://github.com/nanostores/router


### Maps

Map store can be used to store objects with one level of depth and change keys
in this object.

To create map store call `map(initial)` function with initial object.

```ts
import { map } from 'nanostores'

export const $profile = map({
  name: 'anonymous'
})
```

In TypeScript, you can pass type parameter with store’s type:

```ts
export interface ProfileValue {
  name: string,
  email?: string
}

export const $profile = map<ProfileValue>({
  name: 'anonymous'
})
```

`store.set(object)` or `store.setKey(key, value)` methods will change the store.

```ts
$profile.setKey('name', 'Kazimir Malevich')
```

Setting `undefined` will remove optional key:

```ts
$profile.setKey('email', undefined)
```

Store’s listeners will receive third argument with changed key.

```ts
$profile.listen((profile, oldProfile, changed) => {
  console.log(`${changed} new value ${profile[changed]}`)
})
```

You can also listen for specific keys of the store being changed, using
`listenKeys` and `subscribeKeys`.

```ts
listenKeys($profile, ['name'], (value, oldValue, changed) => {
  console.log(`$profile.Name new value ${value.name}`)
})
```

`subscribeKeys(store, keys, cb)` in contrast with `listenKeys(store, keys, cb)`
also call listeners immediately during the subscription.
Please note that when using subscribe for store changes, the initial evaluation
of the callback has undefined old value and changed key.


### Deep Maps

Deep maps work the same as `map`, but it supports arbitrary nesting of objects
and arrays that preserve the fine-grained reactivity.

```ts
import { deepMap, listenKeys } from 'nanostores'

export const $profile = deepMap({
  hobbies: [
    {
      name: 'woodworking',
      friends: [{ id: 123, name: 'Ron Swanson' }]
    }
  ],
  skills: [
    [
      'Carpentry',
      'Sanding'
    ],
    [
      'Varnishing'
    ]
  ]
})

listenKeys($profile, ['hobbies[0].friends[0].name', 'skills[0][0]'])

// Won't fire subscription
$profile.setKey('hobbies[0].name', 'Scrapbooking')
$profile.setKey('skills[0][1]', 'Staining')

// But those will fire subscription
$profile.setKey('hobbies[0].friends[0].name', 'Leslie Knope')
$profile.setKey('skills[0][0]', 'Whittling')
```

Note that `setKey` creates copies as necessary so that no part of the original
object is mutated (but it does not do a full deep copy -- some sub-objects may
still be shared between the old value and the new one).

### Lazy Stores

A unique feature of Nano Stores is that every state has two modes:

* **Mount:** when one or more listeners is mounted to the store.
* **Disabled:** when store has no listeners.

Nano Stores was created to move logic from components to the store.
Stores can listen for URL changes or establish network connections.
Mount/disabled modes allow you to create lazy stores, which will use resources
only if store is really used in the UI.

`onMount` sets callback for mount and disabled states.

```ts
import { onMount } from 'nanostores'

onMount($profile, () => {
  // Mount mode
  return () => {
    // Disabled mode
  }
})
```

For performance reasons, store will move to disabled mode with 1-second delay
after last listener unsubscribing.

Call `keepMount()` to test store’s lazy initializer in tests and `cleanStores`
to unmount them after test.

```js
import { cleanStores, keepMount } from 'nanostores'
import { $profile } from './profile.js'

afterEach(() => {
  cleanStores($profile)
})

it('is anonymous from the beginning', () => {
  keepMount($profile)
  // Checks
})
```


### Computed Stores

Computed store is based on other store’s value.

```ts
import { computed } from 'nanostores'
import { $users } from './users.js'

export const $admins = computed($users, users => {
  // This callback will be called on every `users` changes
  return users.filter(user => user.isAdmin)
})
```

An async function can be evaluated by using `task()`.

```js
import { computed, task } from 'nanostores'

import { $userId } from './users.js'

export const $user = computed($userId, userId => task(async () => {
  const response = await fetch(`https://my-api/users/${userId}`)
  return response.json()
}))
```

By default, `computed` stores update _each_ time any of their dependencies
gets updated. If you are fine with waiting until the end of a tick, you can
use `batched`. The only difference with `computed` is that it will wait until
the end of a tick to update itself.

```ts
import { batched } from 'nanostores'

const $sortBy = atom('id')
const $categoryId = atom('')

export const $link = batched([$sortBy, $categoryId], (sortBy, categoryId) => {
  return `/api/entities?sortBy=${sortBy}&categoryId=${categoryId}`
})

// `batched` will update only once even you changed two stores
export function resetFilters () {
  $sortBy.set('date')
  $categoryIdFilter.set('1')
}
```

Both `computed` and `batched` can be calculated from multiple stores:

```ts
import { $lastVisit } from './lastVisit.js'
import { $posts } from './posts.js'

export const $newPosts = computed([$lastVisit, $posts], (lastVisit, posts) => {
  return posts.filter(post => post.publishedAt > lastVisit)
})
```


### Effects

`effect` subscribes for multiple atoms at once.

`effect` runs its callback on the start, with initial values, as well as
on any stores change. If callback returns cleanup function it will be performed
before next callback run. Besides that, `effect` returns own cleanup function,
which allows cancelling the whole effect.

```js
const $enabled = atom(true)
const $interval = atom(1000)

const cancelPing = effect([$enabled, $interval], (enabled, interval) => {
  if (!enabled) return

  const intervalId = setInterval(() => {
    sendPing()
  }, interval)

  return () => {
    clearInterval(intervalId)
  }
})
```

### Map Creator

If you have many similar stores (for instance, in advanced database ORM),
you can define map creator (like a “class” in OOP).

```js
const User = mapCreator((store, id) => {
  store.set({ id, isLoading: true })
  fetchUser(id).then(data => {
    store.set({ id, isLoading: false, data })
  })
})

let user1 = User('1')
```


### Tasks

`startTask()` and `task()` can be used to mark all async operations
during store initialization.

```ts
import { task } from 'nanostores'

onMount($post, () => {
  task(async () => {
    $post.set(await loadPost())
  })
})
```

You can wait for all ongoing tasks end in tests or SSR with `await allTasks()`.

```jsx
import { allTasks } from 'nanostores'

$post.listen(() => {}) // Move store to active mode to start data loading
await allTasks()

const html = ReactDOMServer.renderToString(<App />)
```


### Store Events

Each store has a few events, which you listen:

* `onMount(store, cb)`: first listener was subscribed with debounce.
  We recommend to always use `onMount` instead of `onStart + onStop`,
  because it has a short delay to prevent flickering behavior.
* `onStart(store, cb)`: first listener was subscribed. Low-level method.
  It is better to use `onMount` for simple lazy stores.
* `onStop(store, cb)`: last listener was unsubscribed. Low-level method.
  It is better to use `onMount` for simple lazy stores.
* `onSet(store, cb)`: before applying any changes to the store.
* `onNotify(store, cb)`: before notifying store’s listeners about changes.

`onSet` and `onNotify` events has `abort()` function to prevent changes
or notification.

```ts
import { onSet } from 'nanostores'

onSet($store, ({ newValue, abort }) => {
  if (!validate(newValue)) {
    abort()
  }
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
import { $profile } from '../stores/profile.js'

export const Header = ({ postId }) => {
  const profile = useStore($profile)
  return <header>Hi, {profile.name}</header>
}
```

[`@nanostores/preact`]: https://github.com/nanostores/preact
[`@nanostores/react`]: https://github.com/nanostores/react


### Vue

Use [`@nanostores/vue`] and `useStore()` composable function
to get store’s value and re-render component on store’s changes.

```vue
<script setup>
import { useStore } from '@nanostores/vue'
import { $profile } from '../stores/profile.js'

const props = defineProps(['postId'])

const profile = useStore($profile)
</script>

<template>
  <header>Hi, {{ profile.name }}</header>
</template>
```

[`@nanostores/vue`]: https://github.com/nanostores/vue


### Svelte

Every store implements [Svelte's store contract]. Put `$` before store variable
to get store’s value and subscribe for store’s changes.

```svelte
<script>
  import { profile } from '../stores/profile.js'
</script>

<header>Hi, {$profile.name}</header>
```

In other frameworks, Nano Stores promote code style to use `$` prefixes
for store’s names. But in Svelte it has a special meaning, so we recommend
to not follow this code style here.

[Svelte's store contract]: https://svelte.dev/docs/svelte-components#script-4-prefix-stores-with-$-to-access-their-values


### Solid

Use [`@nanostores/solid`] and `useStore()` composable function
to get store’s value and re-render component on store’s changes.

```js
import { useStore } from '@nanostores/solid'
import { $profile } from '../stores/profile.js'

export function Header({ postId }) {
  const profile = useStore($profile)
  return <header>Hi, {profile().name}</header>
}
```

[`@nanostores/solid`]: https://github.com/nanostores/solid


### Lit

Use [`@nanostores/lit`] and `StoreController` reactive controller
to get store’s value and re-render component on store’s changes.

```ts
import { StoreController } from '@nanostores/lit'
import { $profile } from '../stores/profile.js'

@customElement('my-header')
class MyElement extends LitElement {
  @property()

  private profileController = new StoreController(this, $profile)

  render() {
    return html\`<header>Hi, ${profileController.value.name}</header>`
  }
}
```

[`@nanostores/lit`]: https://github.com/nanostores/lit


### Angular

Use [`@nanostores/angular`] and `NanostoresService` with `useStore()`
method to get store’s value and subscribe for store’s changes.

```ts
// NgModule:
import { NANOSTORES, NanostoresService } from '@nanostores/angular';

@NgModule({
  providers: [{ provide: NANOSTORES, useClass: NanostoresService }]
})
```

```tsx
// Component:
import { Component } from '@angular/core'
import { NanostoresService } from '@nanostores/angular'
import { Observable, switchMap } from 'rxjs'

import { profile } from '../stores/profile'
import { IUser, User } from '../stores/user'

@Component({
  selector: "app-root",
  template: '<p *ngIf="(currentUser$ | async) as user">{{ user.name }}</p>'
})
export class AppComponent {
  currentUser$: Observable<IUser> = this.nanostores.useStore(profile)
    .pipe(switchMap(userId => this.nanostores.useStore(User(userId))))

  constructor(private nanostores: NanostoresService) { }
}
```

[`@nanostores/angular`]: https://github.com/nanostores/angular


### Vanilla JS

`Store#subscribe()` calls callback immediately and subscribes to store changes.
It passes store’s value to callback.

```js
import { $profile } from '../stores/profile.js'

$profile.subscribe(profile => {
  console.log(`Hi, ${profile.name}`)
})
```

`Store#listen(cb)` in contrast, calls only on next store change. It could be
useful for a multiple stores listeners.

```js
function render () {
  console.log(`${$post.get().title} for ${$profile.get().name}`)
}

$profile.listen(render)
$post.listen(render)
render()
```

See also `listenKeys(store, keys, cb)` to listen for specific keys changes
in the map.


### Server-Side Rendering

Nano Stores support SSR. Use standard strategies.

```js
if (isServer) {
  $settings.set(initialSettings)
  $router.open(renderingPageURL)
}
```

You can wait for async operations (for instance, data loading
via isomorphic `fetch()`) before rendering the page:

```jsx
import { allTasks } from 'nanostores'

$post.listen(() => {}) // Move store to active mode to start data loading
await allTasks()

const html = ReactDOMServer.renderToString(<App />)
```


### Tests

Adding an empty listener by `keepMount(store)` keeps the store
in active mode during the test. `cleanStores(store1, store2, …)` cleans
stores used in the test.

```ts
import { cleanStores, keepMount } from 'nanostores'
import { $profile } from './profile.js'

afterEach(() => {
  cleanStores($profile)
})

it('is anonymous from the beginning', () => {
  keepMount($profile)
  expect($profile.get()).toEqual({ name: 'anonymous' })
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

export const $currentTime = atom<number>(Date.now())

onMount($currentTime, () => {
  $currentTime.set(Date.now())
  const updating = setInterval(() => {
    $currentTime.set(Date.now())
  }, 1000)
  return () => {
    clearInterval(updating)
  }
})
```

Use derived stores to create chains of reactive computations.

```ts
import { computed } from 'nanostores'
import { $currentTime } from './currentTime.js'

const appStarted = Date.now()

export const $userInApp = computed($currentTime, currentTime => {
  return currentTime - appStarted
})
```

We recommend moving all logic, which is not highly related to UI, to the stores.
Let your stores track URL routing, validation, sending data to a server.

With application logic in the stores, it is much easier to write and run tests.
It is also easy to change your UI framework. For instance, add React Native
version of the application.


### Separate changes and reaction

Use a separated listener to react on new store’s value, not an action function
where you change this store.

```diff
  function increase() {
    $counter.set($counter.get() + 1)
-   printCounter(store.get())
  }

+ $counter.listen(counter => {
+   printCounter(counter)
+ })
```

An action function is not the only way for store to a get new value.
For instance, persistent store could get the new value from another browser tab.

With this separation your UI will be ready to any source of store’s changes.


### Reduce `get()` usage outside of tests

`get()` returns current value, and it is a good solution for tests.

But it is better to use `useStore()`, `$store`, or `Store#subscribe()` in UI
to subscribe to store changes and always render the actual data.

```diff
- const { userId } = $profile.get()
+ const { userId } = useStore($profile)
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
