function checkStore (StoreClass, type, id) {
  if (!StoreClass.storeName) {
    throw new Error(`Set \`static storeName\` to ${StoreClass.name}`)
  }
  if (StoreClass.withId && !id) {
    throw new Error(
      `${type} does not accept models, but ${StoreClass.storeName} is model`
    )
  }
  if (!StoreClass.withId && id) {
    throw new Error(
      `${type} accepts only models, but ${StoreClass.storeName} is store`
    )
  }
  if (type === 'initLocalStore' && (!StoreClass.local || StoreClass.withId)) {
    throw new Error(
      `${StoreClass.storeName} should extends LocalStore class ` +
        `to be used in initLocalStore`
    )
  }
  if (type === 'initLocalModel' && (!StoreClass.local || !StoreClass.withId)) {
    throw new Error(
      `${StoreClass.storeName} should extends LocalModel class ` +
        `to be used in initLocalModel`
    )
  }
}

module.exports = { checkStore }
