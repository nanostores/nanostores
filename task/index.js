import { ensureTaskContext, globalContext } from '../context/index.js'

export function startTask(ctx = globalContext) {
  let taskContext = ensureTaskContext(ctx)
  taskContext.t += 1
  return () => {
    taskContext.t -= 1
    if (taskContext.t === 0) {
      let prevResolves = taskContext.r
      taskContext.r = []
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

  if (taskContext.t === 0) {
    return Promise.resolve()
  } else {
    return new Promise(resolve => {
      taskContext.r.push(resolve)
    })
  }
}

export function cleanTasks(ctx = globalContext) {
  ensureTaskContext(ctx).t = 0
}
