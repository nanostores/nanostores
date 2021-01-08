let { change, subscribe, destroy } = require('../store')

function connect (to, from, callback) {
  if (!Array.isArray(from)) from = [from]
  function listener () {
    let diff = callback(...from)
    for (let key in diff) to[change](key, diff[key])
  }
  let unbind = from.map(store => store[subscribe](listener))
  let prev = to[destroy]
  to[destroy] = () => {
    if (prev) prev.apply(to)
    for (let i of unbind) i()
  }

  let diff = callback(...from)
  for (let key in diff) to[change](key, diff[key], true)
}

module.exports = { connect }
