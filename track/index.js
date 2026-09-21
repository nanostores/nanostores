import { nanostoresGlobal } from '../atom/index.js'

// Callback, which changes own dependency on every run, would hang the process
const RUNS_LIMIT = 100

let same = ($store, a, b) => ($store.eq || Object.is)(a, b)

// Checks stores in read order and stops on first change, because later stores
// may be reachable only with old values
export let changed = deps =>
  deps.stores.some(($store, i) => !same($store, deps.values[i], $store.get()))

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
