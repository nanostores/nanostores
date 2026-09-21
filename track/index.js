import { nanostoresGlobal } from '../atom/index.js'

// Callback, which changes own dependency on every run, would hang the process
const RUNS_LIMIT = 100

let same = ($store, a, b) => ($store.eq || Object.is)(a, b)

// Returns callback, explicit stores and true for callback with get() argument
export let parseArgs = (stores, cb) =>
  typeof stores === 'function' ? [stores, [], true] : [cb, [stores].flat()]

// Checks stores in read order and stops on first change, because later stores
// may be reachable only with old values
export let changed = deps =>
  deps.stores.some(($store, i) => !same($store, deps.values[i], $store.get()))

export let syncListeners = (listened, stores, listener) => {
  for (let $store of stores) {
    if (!listened.has($store)) listened.set($store, $store.listen(listener))
  }
  for (let [$store, unbind] of listened) {
    if (!stores.includes($store)) {
      unbind()
      listened.delete($store)
    }
  }
}

// Calls callback with get(), which reads a store and saves it to deps.
// Listens to saved stores if listener was passed.
export let track = (cb, deps, listened, listener) => {
  let previous = deps.stores
  let stores = (deps.stores = [])
  let values = (deps.values = [])
  let active = true
  try {
    return cb($store => {
      if (!active) {
        if (process.env.NODE_ENV !== 'production') {
          throw new Error('Call get() only synchronously inside the callback')
        }
        return $store.get()
      }
      let index = stores.indexOf($store)
      if (~index) return values[index]
      let value = $store.get()
      stores.push($store)
      values.push(value)
      return value
    })
  } catch (error) {
    // Callback did not reach all stores. Keep previous stores too
    // and call the callback again on the next check.
    stores = deps.stores = [...new Set([...previous, ...stores])]
    deps.values = undefined
    throw error
  } finally {
    active = false
    if (
      listener &&
      (previous.length !== stores.length ||
        stores.some(($store, i) => $store !== previous[i]))
    ) {
      syncListeners(listened, stores, listener)
    }
  }
}

// Reading a store can mount it, which can change a store read before, also
// a store behind a computed store. Repeats runIfChanged() until saved values
// are current. runIfChanged() returns true if it called the callback.
export let runUntilCurrent = (deps, runIfChanged) => {
  let runs = 0
  let startEpoch
  do {
    startEpoch = nanostoresGlobal.epoch
    if (runIfChanged() && runs++ > RUNS_LIMIT) {
      throw new Error('Callback changes own dependencies on every run')
    }
  } while (startEpoch !== nanostoresGlobal.epoch && changed(deps))
}
