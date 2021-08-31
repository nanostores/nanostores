# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

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
