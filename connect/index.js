function connect (current, input, callback) {
  if (!Array.isArray(input)) input = [input]
  function listener () {
    let diff = callback(...input)
    for (let key in diff) current.changeKey(key, diff[key])
  }
  let unbind = input.map(store => store.addListener(listener))
  let prev = current.destroy
  current.destroy = () => {
    if (prev) prev.apply(current)
    for (let i of unbind) i()
  }

  let diff = callback(...input)
  for (let key in diff) current[key] = diff[key]
}

module.exports = { connect }
