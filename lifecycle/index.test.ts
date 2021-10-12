import { delay } from 'nanodelay'

import {
  STORE_UNMOUNT_DELAY,
  mapTemplate,
  onNotify,
  onBuild,
  onStart,
  onMount,
  onStop,
  onSet,
  atom,
  map
} from '../index.js'

it('has onStart and onStop listeners', () => {
  let events: string[] = []
  let store = atom(2)
  let unbindStart = onStart(store, () => events.push('start'))
  let unbindStop = onStop(store, () => events.push('stop'))

  let unbindListen = store.listen(() => {})
  let unbindSecond = store.subscribe(() => {})
  expect(events).toEqual(['start'])

  unbindListen()
  unbindSecond()
  expect(events).toEqual(['start', 'stop'])

  store.get()
  expect(events).toEqual(['start', 'stop', 'start', 'stop'])

  let unbindSubscribe = store.subscribe(() => {})
  expect(events).toEqual(['start', 'stop', 'start', 'stop', 'start'])

  unbindStop()
  unbindSubscribe()
  expect(events).toEqual(['start', 'stop', 'start', 'stop', 'start'])

  unbindStart()
  let unbind = store.listen(() => {})
  unbind()
  expect(events).toEqual(['start', 'stop', 'start', 'stop', 'start'])
})

it('tracks onStart from listening', () => {
  let events: string[] = []
  let store = atom(2)

  store.listen(() => {})
  onStart(store, () => events.push('start'))

  store.listen(() => {})
  expect(events).toEqual([])
})

it('shares data between listeners', () => {
  let events: object[] = []
  let store = atom(1)

  onStart<{ test: number }>(store, ({ shared }) => {
    expect(shared.test).toBeUndefined()
    shared.test = store.value
  })
  onStart<{ test: number }>(store, ({ shared }) => {
    events.push(shared)
  })

  let unbind = store.listen(() => {})
  expect(events).toEqual([{ test: 1 }])
  unbind()

  store.set(2)
  store.listen(() => {})
  expect(events).toEqual([{ test: 1 }, { test: 2 }])
})

it('has onSet and onNotify listeners', () => {
  let events: string[] = []
  let store = atom('init')

  let unbindValidation = onSet(store, ({ newValue, abort }) => {
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
  expect(events).toEqual(['value init'])

  events = []
  store.set('new')
  expect(events).toEqual(['set new', 'notify', 'value new'])

  events = []
  store.set('broken')
  expect(events).toEqual(['set broken'])
  expect(store.get()).toBe('new')

  events = []
  store.set('hidden')
  expect(events).toEqual(['set hidden', 'notify'])
  expect(store.get()).toBe('hidden')

  events = []
  unbindValidation()
  store.set('broken')
  expect(events).toEqual(['set broken', 'notify', 'value broken'])
  expect(store.get()).toBe('broken')

  events = []
  unbindHider()
  store.set('hidden')
  expect(events).toEqual(['set hidden', 'notify', 'value hidden'])

  events = []
  unbindSet()
  unbindNotify()
  store.set('new')
  expect(events).toEqual(['value new'])
})

it('supports map in onSet and onNotify', () => {
  let events: string[] = []
  let store = map({ value: 0 })

  onSet(store, e => {
    events.push(`set key ${e.changed} ${e.newValue[e.changed]}`)
    if (e.newValue[e.changed] < 0) e.abort()
  })
  onNotify(store, e => {
    events.push(`notify ${e.changed}`)
  })

  store.subscribe((value, changed) => {
    events.push(`{ value: ${value.value} } ${changed}`)
  })
  expect(events).toEqual(['{ value: 0 } undefined'])

  events = []
  store.setKey('value', 1)
  expect(events).toEqual([
    'set key value 1',
    'notify value',
    '{ value: 1 } value'
  ])

  events = []
  store.set({ value: 2 })
  expect(events).toEqual([
    'set key value 2',
    'notify value',
    '{ value: 2 } value'
  ])

  events = []
  store.setKey('value', -1)
  expect(events).toEqual(['set key value -1'])
  expect(store.get()).toEqual({ value: 2 })

  events = []
  store.set({ value: -2 })
  expect(events).toEqual(['set key value -2'])
  expect(store.get()).toEqual({ value: 2 })
})

it('has onBuild listener', () => {
  let events: string[] = []
  let Template = mapTemplate<{ value: number }>(store => {
    store.setKey('value', 0)
  })

  let unbind = onBuild(Template, ({ store }) => {
    events.push(`build ${store.get().id}`)
  })

  Template('1')
  expect(events).toEqual(['build 1'])

  Template('1')
  expect(events).toEqual(['build 1'])

  Template('2')
  expect(events).toEqual(['build 1', 'build 2'])

  unbind()
  Template('3')
  expect(events).toEqual(['build 1', 'build 2'])
})

it('trigered by listen method', async () => {
  expect.assertions(1)

  let store = atom(0)

  let events: (string | number)[] = []

  let unmountEnhancer = onMount(store, () => {
    events.push('mount')
    return () => {
      events.push('unmount')
    }
  })

  let unbind = store.listen(value => {
    events.push(value)
  })

  store.set(1)
  store.set(2)

  unbind()

  store.set(1)

  await delay(STORE_UNMOUNT_DELAY)
  expect(events).toEqual(['mount', 1, 2, 'unmount'])
  unmountEnhancer()
})

it('trigered by get method', async () => {
  expect.assertions(1)

  let store = atom(0)

  let events: (string | number)[] = []

  let unmountEnhancer = onMount(store, () => {
    events.push('mount')
    return () => {
      events.push('unmount')
    }
  })

  store.get()
  store.get()

  await delay(STORE_UNMOUNT_DELAY)
  expect(events).toEqual(['mount', 'unmount'])
  unmountEnhancer()
})

it('data from constructor', async () => {
  expect.assertions(3)

  let store = atom(0)

  let events: (string | number)[] = []

  let unmountEnhancer = onMount(store, () => {
    events.push('mount')
    store.set(23)
    return () => {
      events.push('unmount')
    }
  })

  expect(store.get()).toBe(23)
  expect(store.get()).toBe(23)

  await delay(STORE_UNMOUNT_DELAY)

  expect(events).toEqual(['mount', 'unmount'])
  unmountEnhancer()
})
