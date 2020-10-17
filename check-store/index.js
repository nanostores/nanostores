function checkStore (StoreClass, id) {
  if (StoreClass.withId && !id) {
    throw new Error(`${StoreClass.name} requires model ID to be loaded`)
  }
  if (!StoreClass.withId && id) {
    throw new Error(`${StoreClass.name} doesn’t use model ID`)
  }
}

module.exports = { checkStore }
