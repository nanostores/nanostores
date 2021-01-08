let { change, subscribe, destroy } = require('../store')

function connect (current, input, callback) {
  if (!Array.isArray(input)) input = [input]
  function listener () {
    let diff = callback(...input)
    for (let key in diff) current[change](key, diff[key])
  }
  let unbind = input.map(store => store[subscribe](listener))
  let prev = current[destroy]
  current[destroy] = () => {
    if (prev) prev.apply(current)
    for (let i of unbind) i()
  }

  let diff = callback(...input)
  for (let key in diff) current[change](key, diff[key], true)
}

module.exports = { connect }
