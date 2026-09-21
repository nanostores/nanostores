import { changed, runUntilCurrent } from '../track/index.js'

export const effect = (stores, callback) => {
  if (!Array.isArray(stores)) stores = [stores]

  let deps = { stores }
  let unbinds = []
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
    // Save values only after the call to repeat it after an error
    let values = stores.map($store => $store.get())
    lastRunUnbind = callback(...values)
    deps.values = values
    // Callback can stop own effect. Stop again to call the new cleanup.
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
