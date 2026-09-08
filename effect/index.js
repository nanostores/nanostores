export const effect = (stores, callback) => {
  if (!Array.isArray(stores)) stores = [stores]

  let unbinds = []
  let lastRunUnbind

  let run = () => {
    lastRunUnbind && lastRunUnbind()

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
    lastRunUnbind && lastRunUnbind()
  }
}
