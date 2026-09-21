import { nanostoresGlobal } from '../atom/index.js'

// Callback, which changes own store on every run, would hang the process
const RUNS_LIMIT = 100

export const effect = (stores, callback) => {
  if (!Array.isArray(stores)) stores = [stores]

  let unbinds = []
  let lastRunUnbind
  let previous
  let updating
  let stopped

  let changed = () =>
    stores.some(
      ($store, i) => !($store.eq || Object.is)(previous[i], $store.get())
    )

  let cleanup = () => {
    let unbind = lastRunUnbind
    lastRunUnbind = undefined
    unbind && unbind()
  }

  let run = () => {
    // Callback can change own store. The loop below will see it.
    if (updating) return
    updating = true
    let runs = 0
    let startEpoch
    try {
      do {
        startEpoch = nanostoresGlobal.epoch
        if (!stopped && (!previous || changed())) {
          if (runs++ > RUNS_LIMIT) {
            throw new Error('Callback changes own dependencies on every run')
          }
          cleanup()
          // Save values only after the call to repeat it after an error
          let values = stores.map($store => $store.get())
          lastRunUnbind = callback(...values)
          previous = values
          // Callback can stop own effect. Stop again to call the new cleanup.
          if (stopped) stop()
        }
      } while (startEpoch !== nanostoresGlobal.epoch && changed())
    } finally {
      updating = false
    }
  }

  let stop = () => {
    stopped = true
    for (let unbind of unbinds) unbind()
    cleanup()
  }

  try {
    for (let $store of stores) unbinds.push($store.listen(run))
    run()
  } catch (error) {
    stop()
    throw error
  }

  return stop
}
