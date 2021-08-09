let effects = 0
let resolves = []

export function startEffect() {
  effects += 1
  return () => {
    effects -= 1
    if (effects === 0) {
      for (let i of resolves) i()
    }
  }
}

export async function effect(cb) {
  let endEffect = startEffect()
  let result
  try {
    result = await cb()
  } finally {
    endEffect()
  }
  return result
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
