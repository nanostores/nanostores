import { clean } from '../clean-stores/index.js'

let listenerQueue = []
export let autosubscribeStack = []
export let atom = initialValue => {
  let listeners = []
  let $atom = (use = autosubscribeStack.at(-1)) =>
    use ? use($atom) : $atom.get()
  $atom.get = () => {
    if (!$atom.lc) {
      $atom.listen(() => {})()
    }
    return $atom.value
  }
  $atom.l = 0
  $atom.lc = 0
  $atom.listen = (listener, listenerStore) => {
    $atom.lc = listeners.push(listener, listenerStore || $atom) / 2

    return () => {
      let index = listeners.indexOf(listener)
      if (~index) {
        listeners.splice(index, 2)
        if (!--$atom.lc) $atom.off()
      }
    }
  }
  $atom.notify = changedKey => {
    let runListenerQueue = !listenerQueue.length
    for (let i = 0; i < listeners.length; i += 2) {
      listenerQueue.push(
        listeners[i],
        listeners[i + 1],
        $atom.value,
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
  $atom.off = () => {} /* It will be called on last listener unsubscribing.
   We will redefine it in onMount and onStop. */
  $atom.set = data => {
    if ($atom.value !== data) {
      $atom.value = data
      $atom.notify()
    }
  }
  $atom.subscribe = (listener, listenerStore) => {
    let unbind = $atom.listen(listener, listenerStore)
    listener($atom.value)
    return unbind
  }
  $atom.value = initialValue

  if (process.env.NODE_ENV !== 'production') {
    $atom[clean] = () => {
      listeners = []
      $atom.lc = 0
      $atom.off()
    }
  }

  return $atom
}
