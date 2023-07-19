import { atom, taskStack } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'

export let computed = (stores, cb) => {
  let $computed = atom()
  let diamondArgs

  if (cb) {
    stores = Array.isArray(stores) ? stores : [stores]
  } else {
    cb = stores
    stores = []
  }
  let predefinedLength = stores.length
  let currentRunId = 0
  let unbinds = []
  let undoValue // $computed.value is undefined

  let run = () => {
    let args = stores.map(store => store.value)
    if (!diamondArgs || args.some((arg, i) => arg !== diamondArgs[i])) {
      let runId = ++currentRunId
      let stale = () => runId !== currentRunId
      let task = storeOrCb => {
        if (!storeOrCb) return $computed.value
        if (storeOrCb.get) {
          if (!~stores.indexOf(storeOrCb)) {
            stores.push(storeOrCb)
            unbinds.push(storeOrCb.listen(run, $computed))
            args.push(storeOrCb.value)
            $computed.l = Math.max($computed.l, storeOrCb.l + 1)
          }
          return storeOrCb.get()
        }
        taskStack.push(task)
        try {
          return storeOrCb()
        } finally {
          taskStack.pop()
        }
      }
      task.set = newValue => {
        if (!stale()) {
          $computed.set(newValue)
        }
        return task
      }
      task.save = newValue => {
        if (!stale()) {
          $computed.set(undoValue = newValue)
        }
        return task
      }
      task.stale = stale
      task.undo = () => task.set(undoValue)
      let runValue = task(() =>
        predefinedLength
        ? cb(...args.slice(0, predefinedLength))
        : cb(task))
      let complete = newValue =>{
        if (stale()) return
        if (newValue === task) {
          undoValue = $computed.value
        } else {
          $computed.set(undoValue = newValue)
        }
      }
      diamondArgs = args
      if (runValue && runValue.then) {
        runValue.then(complete)
      } else {
        complete(runValue)
      }
    }
  }

  onMount($computed, () => {
    for (let store of stores) {
      unbinds.push(store.listen(run, $computed))
      $computed.l = Math.max($computed.l, store.l + 1)
    }
    run()
    return () => {
      for (let unbind of unbinds) unbind()
      unbinds.length = 0
    }
  })

  return $computed
}

