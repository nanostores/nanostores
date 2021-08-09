let effects = 0
let resolves = []

export function startEffect() {
  effects += 1
  return () => {
    effects -= 1
    if (effects === 0) {
      let prevResolves = resolves
      resolves = []
      for (let i of prevResolves) i()
    }
  }
}

export function effect(cb) {
  let endEffect = startEffect()
  return cb().finally(endEffect)
}

export function allEffects() {
  if (effects === 0) {
    return Promise.resolve()
  } else {
    return new Promise(resolve => {
      resolves.push(resolve)
    })
  }
}

export function clearEffects() {
  effects = 0
}
