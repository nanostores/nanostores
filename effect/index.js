export const effect = (stores, callback) => {
  if (!Array.isArray(stores)) stores = [stores]

  let unbinds = []
  let lastRunUnbind

  // Forget the cleanup before calling it, so a throwing run
  // or a second unsubscribe will not call it again
  let cleanup = () => {
    let unbind = lastRunUnbind
    lastRunUnbind = undefined
    unbind && unbind()
  }

  let run = () => {
    cleanup()

    let values = stores.map(store => store.get())
    lastRunUnbind = callback(...values)
  }

  try {
    for (let store of stores) unbinds.push(store.listen(run))
    run()
  } catch (error) {
    unbinds.forEach(unbind => unbind())
    throw error
  }

  return () => {
    unbinds.forEach(unbind => unbind())
    cleanup()
  }
}
