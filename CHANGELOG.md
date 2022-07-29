# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

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
