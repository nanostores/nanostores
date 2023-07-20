import { delay } from 'nanodelay'
import { test } from 'uvu'
import { equal, is } from 'uvu/assert'

import { actionId } from '../action/index.js'
import {
  action,
  allTasks,
  atom,
  map,
  onAction,
  onMount,
  onNotify,
  onSet,
  onStart,
  onStop,
  resetContext,
  STORE_UNMOUNT_DELAY
} from '../index.js'

test.before.each(() => {
  resetContext()
})

test('has onStart and onStop listeners', () => {
  let events: string[] = []
  let store = atom(2)
  let unbindStart = onStart(store, () => events.push('start'))
  let unbindStop = onStop(store, () => events.push('stop'))

  let unbindListen = store.listen(() => {})
  let unbindSecond = store.subscribe(() => {})
  equal(events, ['start'])

  unbindListen()
  unbindSecond()
  equal(events, ['start', 'stop'])

  store.get()
  equal(events, ['start', 'stop', 'start', 'stop'])

  let unbindSubscribe = store.subscribe(() => {})
  equal(events, ['start', 'stop', 'start', 'stop', 'start'])

  unbindStop()
  unbindSubscribe()
  equal(events, ['start', 'stop', 'start', 'stop', 'start'])

  unbindStart()
  let unbind = store.listen(() => {})
  unbind()
  equal(events, ['start', 'stop', 'start', 'stop', 'start'])
})

test('tracks onStart from listening', () => {
  let events: string[] = []
  let store = atom(2)

  store.listen(() => {})
  onStart(store, () => {
    store.get()
    events.push('start')
  })

  store.listen(() => {})
  equal(events, [])
})

test('shares data between onStart listeners', () => {
  let events: object[] = []
  let store = atom(1)

  onStart<{ test: number }>(store, ({ shared }) => {
    is(shared.test, undefined)
    shared.test = 1
  })
  onStart<{ test: number }>(store, ({ shared }) => {
    events.push(shared)
  })

  store.listen(() => {})
  equal(events, [{ test: 1 }])
})

test('shares data between onStop listeners', () => {
  let events: object[] = []
  let store = atom(1)

  onStart<{ test: number }>(store, ({ shared }) => {
    is(shared.test, undefined)
    shared.test = 1
  })
  onStart<{ test: number }>(store, ({ shared }) => {
    events.push(shared)
  })

  let unbindListen = store.listen(() => {})
  unbindListen()
  equal(events, [{ test: 1 }])
})

test('shares data between onMount listeners', () => {
  let events: object[] = []
  let store = atom(1)

  onStart<{ test: number }>(store, ({ shared }) => {
    is(shared.test, undefined)
    shared.test = 1
  })
  onStart<{ test: number }>(store, ({ shared }) => {
    events.push(shared)
  })

  store.listen(() => {})
  equal(events, [{ test: 1 }])
})

test('shares data between onSet listeners', () => {
  let events: object[] = []
  let store = atom(1)

  onSet<{ test: number }>(store, ({ shared }) => {
    is(shared.test, undefined)
    shared.test = 1
  })
  onSet<{ test: number }>(store, ({ shared }) => {
    events.push(shared)
  })

  let unbindListen = store.listen(() => {})

  store.set(2)
  unbindListen()

  equal(events, [{ test: 1 }])
})

test('shares data between onNotify listeners', () => {
  let events: object[] = []
  let store = atom(1)

  onNotify<{ test: number }>(store, ({ shared }) => {
    is(shared.test, undefined)
    shared.test = 1
  })
  onNotify<{ test: number }>(store, ({ shared }) => {
    events.push(shared)
  })

  let unbindNotify = store.listen(() => {})

  store.set(2)
  unbindNotify()

  equal(events, [{ test: 1 }])
})

test("doesn't share data between different listeners", () => {
  let events: object[] = []
  let store = atom(1)

  onStart<{ test: number }>(store, ({ shared }) => {
    is(shared.test, undefined)
    shared.test = 1
  })
  onSet<{ test: number }>(store, ({ shared }) => {
    events.push(shared)
  })

  let unbindNotify = store.listen(() => {})

  store.set(2)
  unbindNotify()

  equal(events, [{}])
})

test('has onSet and onNotify listeners', () => {
  let events: string[] = []
  let store = atom('init')

  let unbindValidation = onSet(store, ({ abort, newValue }) => {
    if (newValue === 'broken') abort()
  })
  let unbindSet = onSet(store, ({ newValue }) => {
    events.push(`set ${newValue}`)
  })
  let unbindHider = onNotify(store, ({ abort }) => {
    if (store.get() === 'hidden') abort()
  })
  let unbindNotify = onNotify(store, () => {
    events.push('notify')
  })

  store.subscribe(value => {
    events.push('value ' + value)
  })
  equal(events, ['value init'])

  events = []
  store.set('new')
  equal(events, ['set new', 'notify', 'value new'])

  events = []
  store.set('broken')
  equal(events, ['set broken'])
  equal(store.get(), 'new')

  events = []
  store.set('hidden')
  equal(events, ['set hidden', 'notify'])
  equal(store.get(), 'hidden')

  events = []
  unbindValidation()
  store.set('broken')
  equal(events, ['set broken', 'notify', 'value broken'])
  equal(store.get(), 'broken')

  events = []
  unbindHider()
  store.set('hidden')
  equal(events, ['set hidden', 'notify', 'value hidden'])

  events = []
  unbindSet()
  unbindNotify()
  store.set('new')
  equal(events, ['value new'])
})

test('supports map in onSet and onNotify', () => {
  let events: string[] = []
  let store = map({ value: 0 })

  onSet(store, e => {
    if (e.changed) {
      let newValue = e.newValue[e.changed]
      events.push(`set key ${e.changed} ${newValue}`)
      if (e.newValue[e.changed] < 0) e.abort()
    } else {
      events.push(`set all ${e.newValue.value}`)
      if (e.newValue.value < 0) e.abort()
    }
  })
  onNotify(store, e => {
    events.push(`notify ${e.changed}`)
  })

  store.subscribe((value, changed) => {
    events.push(`{ value: ${value.value} } ${changed}`)
  })
  equal(events, ['{ value: 0 } undefined'])

  events = []
  store.setKey('value', 1)
  equal(events, ['set key value 1', 'notify value', '{ value: 1 } value'])

  events = []
  store.set({ value: 2 })
  equal(events, ['set all 2', 'notify undefined', '{ value: 2 } undefined'])

  events = []
  store.setKey('value', -1)
  equal(events, ['set key value -1'])
  equal(store.get(), { value: 2 })

  events = []
  store.set({ value: -2 })
  equal(events, ['set all -2'])
  equal(store.get(), { value: 2 })
})

test('triggered by listen method', async () => {
  let store = atom(0)

  let events: (number | string)[] = []

  let unbindStop1 = onStop(store, () => {
    events.push('stop1')
  })
  let unbindMount1 = onMount(store, () => {
    events.push('mount1')
    return () => {
      events.push('unmount1')
    }
  })
  onStop(store, () => {
    events.push('stop2')
  })
  let unbindMount2 = onMount(store, () => {
    events.push('mount2')
    return () => {
      events.push('unmount2')
    }
  })

  let unbind1 = store.listen(value => {
    events.push(value)
  })

  store.set(1)
  store.set(2)
  unbind1()
  store.set(3)
  equal(events, ['mount2', 'mount1', 1, 2, 'stop2', 'stop1'])

  await delay(STORE_UNMOUNT_DELAY)
  equal(events, [
    'mount2',
    'mount1',
    1,
    2,
    'stop2',
    'stop1',
    'unmount2',
    'unmount1'
  ])
  unbindMount1()
  unbindStop1()

  let unbind2 = store.listen(value => {
    events.push(value)
  })

  store.set(4)

  unbindMount2()
  unbind2()
  await delay(STORE_UNMOUNT_DELAY)
  equal(events, [
    'mount2',
    'mount1',
    1,
    2,
    'stop2',
    'stop1',
    'unmount2',
    'unmount1',
    'mount2',
    4,
    'stop2'
  ])
})

test('triggered by get method', async () => {
  let store = atom(0)

  let events: [string, number?][] = []

  let unmountEnhancer = onMount(store, () => {
    events.push(['mount', store.get()])
    return () => {
      events.push(['unmount'])
    }
  })

  store.get()
  store.get()

  await delay(STORE_UNMOUNT_DELAY)
  equal(events, [['mount', 0], ['unmount']])
  unmountEnhancer()
})

test('sets data from constructor', async () => {
  let store = atom(0)

  let events: (number | string)[] = []

  let unmountEnhancer = onMount(store, () => {
    events.push('mount')
    store.set(23)
    return () => {
      events.push('unmount')
    }
  })

  equal(store.get(), 23)
  equal(store.get(), 23)

  await delay(STORE_UNMOUNT_DELAY)

  equal(events, ['mount', 'unmount'])
  unmountEnhancer()
})

test('has onAction listener', async () => {
  let err = Error('error-in-action')
  let errors: string[] = []
  let events: string[] = []
  let catched: Error | undefined
  let store = atom(0)

  is('action' in store, false)

  let unbind = onAction(store, ({ actionName, onEnd, onError }) => {
    events.push(actionName)
    onError(({ error }) => {
      events.push('error')
      errors.push(error.message)
    })
    onEnd(() => {
      events.push('end')
    })
  })
  is('action' in store, true)

  let unbind2 = onAction(store, ({ actionName, onEnd, onError }) => {
    events.push(actionName)
    onError(() => {
      events.push('error')
    })
    onEnd(() => {
      events.push('end')
    })
  })

  try {
    await action(store, 'errorAction', async () => {
      throw err
    })()
  } catch (error) {
    if (error instanceof Error) catched = error
  }

  is(catched, err)
  equal(events, ['errorAction', 'errorAction', 'error', 'error', 'end', 'end'])
  equal(errors, ['error-in-action'])

  events = []
  unbind2()

  let run = action(store, 'action', async () => {})
  await run()
  await run()
  equal(events, ['action', 'end', 'action', 'end'])

  unbind()
})

test('supports sync actions', () => {
  let store = atom(0)
  let events: string[] = []

  let unbind = onAction(store, ({ onEnd }) => {
    events.push('start')
    onEnd(() => {
      events.push('end')
    })
  })

  action(store, 'action', () => {})()
  equal(events, ['start', 'end'])

  unbind()
})

test('onAction race', async () => {
  let $atom = atom(0)
  let acc: any = {}

  onAction($atom, ({ actionName, id, onEnd }) => {
    acc[id] = [`${actionName}-${id}`]
    onEnd(() => {
      acc[id].push('end')
    })
  })

  onSet($atom, ({ newValue }) => {
    let id = $atom[actionId]
    if (id) acc[id].push(newValue.toString())
  })

  let myAction = action($atom, 'my-store', async (s, d) => {
    await delay(d)
    s.set(d)
  })

  myAction(40)
  myAction(10)

  await allTasks()

  equal(acc, {
    '1': ['my-store-1', '40', 'end'],
    '2': ['my-store-2', '10', 'end']
  })
})

test.run()
