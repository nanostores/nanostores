let debounce = (inAtom, scheduleFn) => {
  let outAtom = atom(inAtom.get())

  let previousVal

  inAtom.listen(val => {
    if (!previousVal) {
      scheduleFn(() => {
        outAtom.set(previousVal)
        previousVal = null
      })
    } else {
      previousVal = val
    }
  })

  return outAtom
}

export const timeoutDebounce = (inAtom, timeout) => {
  timeout = timeout ?? 0
  let scheduleFn = callback => {
    setTimeout(val => callback(val), timeout)
  }

  return debounce(inAtom, scheduleFn)
}
