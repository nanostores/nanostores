export const effect = (stores, callback) => {
  if (!Array.isArray(stores)) stores = [stores]

  let unbinds = []
  let lastRunUnbind
  let previous

  let run = () => {
    if (
      previous &&
      stores.every(($store, i) =>
        ($store.eq || Object.is)(previous[i], $store.get())
      )
    ) {
      return
    }
    lastRunUnbind && lastRunUnbind()

    // Save values only after the call to repeat it after an error
    let values = stores.map(store => store.get())
    lastRunUnbind = callback(...values)
    previous = values
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
    lastRunUnbind && lastRunUnbind()
  }
}
