import { clean } from '../clean-stores/index.js'

let listenerQueue = []
export let taskStack = []
export let getTask = cb =>
  cb ? taskStack.at(-1)(cb) : taskStack.at(-1)

export let atom = (initialValue, level) => {
  let listeners = []
  let store = (task = taskStack.at(-1)) =>
    task ? task(store) : store.get()
  store.get = () => {
    if (!store.lc) {
      store.listen(() => {})()
    }
    return store.value
  }
  store.l = level || 0
  store.lc = 0
  store.listen = (listener, listenerStore) => {
    store.lc = listeners.push(listener, listenerStore || store) / 2
    return () => {
      let index = listeners.indexOf(listener)
      if (~index) {
        listeners.splice(index, 2)
        if (!--store.lc) store.off()
      }
    }
  }
  store.notify = changedKey => {
    let runListenerQueue = !listenerQueue.length
    for (let i = 0; i < listeners.length; i += 2) {
      listenerQueue.push(
        listeners[i],
        listeners[i + 1],
        store.value,
        changedKey,
      )
    }

    if (runListenerQueue) {
      for (let i = 0; i < listenerQueue.length; i += 4) {
        let skip
        for (let j = i + 1; !skip && (j += 4) < listenerQueue.length;) {
          if (listenerQueue[j].l < listenerQueue[i + 1].l) {
            skip = listenerQueue.push(
              listenerQueue[i],
              listenerQueue[i + 1],
              listenerQueue[i + 2],
              listenerQueue[i + 3]
            )
           }
        }

        if (!skip) {
          listenerQueue[i](listenerQueue[i + 2], listenerQueue[i + 3])
        }
      }
      listenerQueue.length = 0
    }
  }
  store.off = () => {} /* It will be called on last listener unsubscribing.
                          We will redefine it in onMount and onStop. */
  store.set = data => {
    if (store.value !== data) {
      store.value = data
      store.notify()
    }
  }
  store.subscribe = (listener, listenerStore) => {
    let unbind = store.listen(listener, listenerStore)
    listener(store.value)
    return unbind
  }
  store.t = taskStack.at(-1)
  store.value = initialValue

  if (process.env.NODE_ENV !== 'production') {
    store[clean] = () => {
      listeners = []
      store.lc = 0
      store.off()
    }
  }

  return store
}
