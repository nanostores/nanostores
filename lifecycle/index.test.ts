import { atom } from '../atom/index.js'
import { onChange, onCreate, onOff, onSet } from './index.js'

const run_all = (fns: { (): any }[]): any => fns.map((cb): any => cb())

describe('store lifecycle', () => {
  it('onCreate (from listen)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onCreate(store, () => events.push('ok'))
    let unsubAtom = store.listen(() => {})
    expect(events).toEqual(['ok'])
    run_all([unsubHook, unsubAtom])
  })

  it('onCreate (from subscribe)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onCreate(store, () => events.push('ok'))
    let unsubAtom = store.subscribe(() => {})
    expect(events).toEqual(['ok'])
    run_all([unsubHook, unsubAtom])
  })

  it('onCreate (do not call)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubAtom = store.subscribe(() => {})
    let unsubHook = onCreate(store, () => events.push('ok'))
    store.subscribe(() => {})
    expect(events).toEqual([])
    run_all([unsubHook, unsubAtom])
  })

  it('onOff (from listen)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onOff(store, () => events.push('ok'))
    let unsubAtom = store.listen(() => {})
    unsubAtom()
    expect(events).toEqual(['ok'])
    unsubHook()
  })

  it('onOff (from subscribe)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onOff(store, () => events.push('ok'))
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
    let unsubHook = onSet(store, ({ methods }) => {
      methods.abort()
    })
    store.listen(() => {
      events.push('i will never call')
    })
    store.set(3)
    expect(events).toEqual([])
    unsubHook()
  })

  it('onChange', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onChange(store, () => events.push('ok'))
    store.set(3)
    expect(events).toEqual(['ok'])
    unsubHook()
  })

  it('onChange (abort)', () => {
    let events: string[] = []
    let store = atom(2)
    let unsubHook = onChange(store, ({ methods }) => {
      methods.abort()
    })
    store.listen(() => {
      events.push('i will never call')
    })
    store.set(3)
    expect(events).toEqual([])
    unsubHook()
  })
})
