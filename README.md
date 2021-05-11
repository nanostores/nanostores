# Logux State

<img align="right" width="95" height="148" title="Logux logotype"
     src="https://logux.io/branding/logotype.svg">

A tiny state manager for **React**, **Vue** and **Svelte**.
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
  counter.set([])
})

export function addUser(user: User) {
  getValue(counter).push(user)
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
  let list = useStore(admins)
  return (
    <ul>
      {list.map(user => <Admin user={user}>)}
    </ul>
  )
}
```

It is part of Logux project, but can be used without any other Logux parts.

* **[Guide, recipes, and API](https://logux.io/)**
* **[Chat](https://gitter.im/logux/logux)** for any questions
* **[Issues](https://github.com/logux/logux/issues)**
  and **[roadmap](https://github.com/orgs/logux/projects/1)**
* **[Projects](https://logux.io/guide/architecture/parts/)**
  inside Logux ecosystem

<a href="https://evilmartians.com/?utm_source=logux-client">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>

[Size Limit]: https://github.com/ai/size-limit


## Install

For common use cases:

```sh
npm install @logux/state
```
