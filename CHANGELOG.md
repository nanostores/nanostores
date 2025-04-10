# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

## 1.0.1
* Fixed types.

## 1.0.0
* Added `effect()` (by @psd-coder).
* Added `getKey()` (by @gismya).
* Fixed types for better compatibility with `Record` (by @gismya).
* Fixed types (by @SerenModz21).
* Removed Node.js 18 support.

## 0.11.4
* Fixed `subscribeKeys` types (by @gismya).

## 0.11.3
* Fixed types of `computed()` with `task()` inside.

## 0.11.2
* Fixed map types (by @gismya).

## 0.11.1
* Fixed types.

## 0.11.0
* Mutate only change paths in `deepMap()` (by @russelldavis).
* Moved `Store#notify()` back to public API (by @gismya).
* Added `subscribeKeys()` (by @gismya).
* Added `setByKey()` export (by @yhdgms1).
* Fixed queued listeners after they are unsubscribed (by @gismya).
* Fixed stale computed values (by @russelldavis).
* Improved `computed()` performance (by @russelldavis).
* Reduced size (by @Minhir).
* Improved types (by @psd-coder).

## 0.10.3
* Fixed incorrect previous value when listening deep store (by @euaaaio).

## 0.10.2
* Fixed old value when listening for deep `deepMap` (by @euaaaio).

## 0.10.1
* Fixed passing old value to `onNotify` callback (by @euaaaio).

## 0.10.0
* Removed `action()`.
* Update computed values before other listeners (by @gismya).
* Added `mapCreator()`.
* Added `oldValue` to `subscribe`/`listen` (by @gismya).
* Added async `computed` support with `task` (by @btakita).
* Added batched `computed` (by @dkzlv).
* Added `StoreValues` and `Task` types to exports.
* Removed Node.js 16 support.

## 0.9.5
* Fixed nested arrays support in `deepMap` (by Mikita Taukachou).

## 0.9.4
* Fixed `deepMap` and `computed` (by Eduard Aksamitov).
* Reduced size (by Brian Takita).
* Fixed docs (by Lars Johansson and Brian Takita).

## 0.9.3
* Fixed support for synchronous action for `onAction` (by Eduard Aksamitov).
* Added `actionId` export (by Eduard Aksamitov).

## 0.9.2
* Fixed `getPath` and `setPath` exports (by Dan Kozlov).
* Fixed docs (Robert Kuzhin).

## 0.9.1
* Fixed `computed()` with `undefined` input (by Bogdan Chadkin).

## 0.9
* Call subscribers only if store’s value as changed (by Bogdan Chadkin).
* Removed deprecated 0.7 API.
* Added `Store#value` to public API.
* Reduced size (by Bogdan Chadkin).
* Moved to `import type`.
* Fixed docs (by Joshua Byrd & @Royserg).

## 0.8.1
* Marked deprecated types by TSDoc.

## 0.8
* Added `deepMap` store (by Dan Kozlov).
* Added `onAction` event (by Eduard Aksamitov).
* Deprecate `mapTemplate`.
* Removed Node.js 14 support.

## 0.7.4
* Fixed `onStop()` and `onMount()` conflict.

## 0.7.3
* Fixed infinite loop on some diamond dependencies (by Roman Gorev).

## 0.7.2
* Fixed diamond dependency problem (by Roman Gorev).

## 0.7.1
* Fixed calling `get()` in `onMount()` and `onStart()`.
* Fixed atom type (by Brian Takita).

## 0.7
* Removed deprecated 0.4 API.

## 0.6
* Dropped Node.js 12 support.

## 0.5.13
* Fixed types for atom initial value (by @itsMapleLeaf).

## 0.5.12
* Fixed `computed` regression (by Brian Takita).

## 0.5.11
* Fixed wrong listeners order after `store.off()` (by Brian Takita).

## 0.5.10
* Fixed multiple `onMount` listeners support.

## 0.5.9
* Fixed `onMount` support in `computed` stores.

## 0.5.8
* Fixed `AnySyncTemplate` type (by Eduard Aksamitov).

## 0.5.7
* Fixed `Atom#notify()` types (by Aleksandr Slepchenkov).
* Fixed docs (by Gor Davtyan and Daniil Pronin).

## 0.5.6
* Fixed deprecate types.

## 0.5.5
* Fixed deprecate types.

## 0.5.4
* Fixed docs.

## 0.5.3
* Fixed `action()` types.

## 0.5.2
* Fixed types (by @davidmz).
* Fixed docs (by Eduard Aksamitov).

## 0.5.1
* Reduced package size.

## 0.5 “Eustratius”
* Renamed `createStore()` to `atom()` (by Usman Yunusov).
* Renamed `createMap()` to `map()` (by Usman Yunusov).
* Renamed `defineMap()` to `mapTemplate()` (by Usman Yunusov).
* Renamed `createdDerived()` to `computed()` (by Usman Yunusov).
* Renamed `effect` to `task`.
* Renamed `keepAlive()` to `keepMount()`.
* Replaced `getValue(store)` with `store.get()`.
* Removed store cleaning in disabled mode.
* Moved React/Preact/Vue integrations to separated packages.
* Added store events like `onMount` or `onSet` (by @eddort).
* Added `action()` wrapper to change tracking (by @eddort).
* Added `listenKeys()` to listen for specific keys in map store.
* Map store now change object link on changes (by Eduard Aksamitov).
* Fixed diamond problem (by @eddort).

## 0.4.9
* Fixed Vue re-render (by Eduard Aksamitov).

## 0.4.8
* Fixed optional keys in map store.
* Fixed functions as store value support.

## 0.4.7
* Fixed package size.

## 0.4.6
* Fixed map store default type (by Alexey Berezin).

## 0.4.5
* Fixed key type in map store methods (by Alexey Berezin).

## 0.4.4
* Fixed `changedKey` type in map store (by Aleksandr Slepchenkov).

## 0.4.3
* Fixed cleaning effects in tests.
* Reduced all features size.

## 0.4.2
* Fixed ending effect on error.
* Fixed docs (by @droganov).

## 0.4.1
* Fixed React `batch` types.

## 0.4 “Zhang Xu”
* Moved router and persistent store to separated projects.
* Added project logo (by Eduard Aksamitov).
* Added React Native support.
* Added `effect()` and `allEffects()` functions for tests.
* Added `update()` and `updateKey()` helpers.
* Fixed stores on listeners changes during store change event.
* Fixed `cleanStores()` on `undefined` in store.

## 0.3.3
* Fixed React batching.
* Fixed docs (by Aleksandr Slepchenkov).

## 0.3.2
* Fixed map store initializer regression.

## 0.3.1
* Fixed `MapStore#setKey()` regression.

## 0.3 “Esmâ Ibret Hanim”
* Renamed project to `nanostores`
* Split `Store` type to `ReadableStore` and `WritableStore`.
* Added `redirectPage()` (by Aleksei Gurianov).

## 0.2 “Hasan Çeleb”
* Do not clean store’s value on no listeners.
* Added Preact support (by @Merciful12).
* Added docs.
* Added `keepActive()` shortcut.
* Added `BuilderStore<typeof Builder>` type.
* Fixed examples (by @2bj).

## 0.1 “Ahmed Karahisari”
* Initial release.
