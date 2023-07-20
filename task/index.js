let tasks = 0
let resolves = []
export let taskSymbol = Symbol()

export function startTask() {
  tasks += 1
  return () => {
    tasks -= 1
    if (tasks === 0) {
      let prevResolves = resolves
      resolves = []
      for (let i of prevResolves) i()
    }
  }
}

export function task(cb) {
  let endTask = startTask()
  let val = cb().finally(endTask)
  val[taskSymbol] = true
  return val
}

export function allTasks() {
  if (tasks === 0) {
    return Promise.resolve()
  } else {
    return new Promise(resolve => {
      resolves.push(resolve)
    })
  }
}

export function cleanTasks() {
  tasks = 0
}
