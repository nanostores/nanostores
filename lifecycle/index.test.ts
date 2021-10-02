import { atom } from '../atom/index.js'
import { onNotify, onStart, onStop, onSet } from '../index.js'

function runAll(functions: (() => void)[]): void {
  for (let fn of functions) fn()
}

describe('store lifecycle', () => {
  it('onStart (from listen)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onStart(store, () => events.push('ok'))
    let unsubAtom = store.listen(() => {})
    expect(events).toEqual(['ok'])
    runAll([unsubHook, unsubAtom])
  })

  it('onStart (from subscribe)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onStart(store, () => events.push('ok'))
    let unsubAtom = store.subscribe(() => {})
    expect(events).toEqual(['ok'])
    runAll([unsubHook, unsubAtom])
  })

  it('onStart (from store.get)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onStart(store, () => events.push('ok'))
    store.get()
    expect(events).toEqual(['ok'])
    runAll([unsubHook])
  })

  it('onStart (not called)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubAtom = store.subscribe(() => {})
    let unsubHook = onStart(store, () => events.push('ok'))
    store.subscribe(() => {})
    expect(events).toEqual([])
    runAll([unsubHook, unsubAtom])
  })

  it('onStart shared data', () => {
    let store = atom(1)
    let events: unknown[] = []

    let unsub = onSet(store, api => {
      events.push(api.shared)
    })

    let unsub2 = onSet<{ test: number }>(store, api => {
      api.shared.test = 1
    })

    store.set(2)

    runAll([unsub, unsub2])
    expect(events).toEqual([{ test: 1 }])
  })

  it('onOff (from listen)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onStop(store, () => events.push('ok'))
    let unsubAtom = store.listen(() => {})
    unsubAtom()
    expect(events).toEqual(['ok'])
    unsubHook()
  })

  it('onOff (from subscribe)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onStop(store, () => events.push('ok'))
    let unsubAtom = store.subscribe(() => {})
    unsubAtom()
    expect(events).toEqual(['ok'])
    unsubHook()
  })

  it('onSet', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onSet(store, () => events.push('ok'))
    store.set(3)
    expect(events).toEqual(['ok'])
    unsubHook()
  })

  it('onSet (abort)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onSet(store, ({ abort }) => {
      abort()
    })
    store.listen(() => {
      events.push('It would never be called')
    })
    store.set(3)
    expect(events).toEqual([])
    unsubHook()
  })

  it('onNotify', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onNotify(store, () => events.push('ok'))
    store.set(3)
    expect(events).toEqual(['ok'])
    unsubHook()
  })

  it('onNotify (abort)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onNotify(store, ({ abort }) => {
      abort()
    })
    store.listen(() => {
      events.push('It would never be called')
    })
    store.set(3)
    expect(events).toEqual([])
    unsubHook()
  })
})
