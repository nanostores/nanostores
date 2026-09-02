let tasks = 0
let taskId = 0
let resolves = []

export function startTask() {
  let id = taskId
  tasks += 1
  return () => {
    if (id !== taskId) return
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
  let promise
  try {
    promise = Promise.resolve(cb()).finally(endTask)
  } catch (error) {
    endTask()
    throw error
  }
  promise.t = true
  return promise
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
  taskId += 1
  tasks = 0
}
