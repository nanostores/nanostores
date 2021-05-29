export function getValue(store) {
  if (store.active) {
    return store.value
  } else {
    let result
    let unbind = store.subscribe(value => {
      result = value
    })
    unbind()
    return result
  }
}
