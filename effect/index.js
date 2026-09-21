import {
  changed,
  parseArgs,
  runUntilCurrent,
  syncListeners,
  track
} from '../track/index.js'

export const effect = (stores, callback) => {
  let auto
  ;[callback, stores, auto] = parseArgs(stores, callback)

  let deps = { stores }
  let listened = new Map()
  let lastRunUnbind
  let updating
  let stopped

  let cleanup = () => {
    let unbind = lastRunUnbind
    lastRunUnbind = undefined
    unbind && unbind()
  }

  let runIfChanged = () => {
    if (stopped || (deps.values && !changed(deps))) return
    cleanup()
    if (auto) {
      lastRunUnbind = track(callback, deps, listened, run)
    } else {
      // Save values only after the call to repeat it after an error
      let values = stores.map($store => $store.get())
      lastRunUnbind = callback(...values)
      deps.values = values
    }
    // Callback can stop own effect. Stop again to call the new cleanup
    // and to unbind from stores, which was read after the stop.
    if (stopped) stop()
    return true
  }

  let run = () => {
    // Callback can change own dependency. runUntilCurrent() will see it.
    if (updating) return
    updating = true
    try {
      runUntilCurrent(deps, runIfChanged)
    } finally {
      updating = false
    }
  }

  let stop = () => {
    stopped = true
    syncListeners(listened, [], run)
    cleanup()
  }

  try {
    syncListeners(listened, stores, run)
    run()
  } catch (error) {
    stop()
    throw error
  }

  return stop
}
