import { ensureTaskContext, globalContext } from '../context/index.js'

export function startTask(ctx = globalContext) {
  let taskContext = ensureTaskContext(ctx)
  taskContext.tasks += 1
  return () => {
    taskContext.tasks -= 1
    if (taskContext.tasks === 0) {
      let prevResolves = taskContext.resolves
      taskContext.resolves = []
      for (let i of prevResolves) i()
    }
  }
}

export function task(cb, ctx = globalContext) {
  let endTask = startTask(ctx)
  return cb().finally(endTask)
}

export function allTasks(ctx = globalContext) {
  let taskContext = ensureTaskContext(ctx)

  if (taskContext.tasks === 0) {
    return Promise.resolve()
  } else {
    return new Promise(resolve => {
      taskContext.resolves.push(resolve)
    })
  }
}

export function cleanTasks(ctx = globalContext) {
  ensureTaskContext(ctx).tasks = 0
}
