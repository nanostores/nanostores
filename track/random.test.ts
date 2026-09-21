// Builds random graphs with explicit stores, with get() and with plain
// functions, makes random changes and compares all three after every step.
import FakeTimers from '@sinonjs/fake-timers'
import { equal, ok } from 'node:assert'
import { test } from 'node:test'

import {
  atom,
  batch,
  computed,
  effect,
  type ReadableAtom,
  type WritableAtom
} from '../index.js'

const GRAPHS = 300
const SOURCES = 4
const NODES = 8
const STEPS = 40

let clock = FakeTimers.install()

// Mulberry32. The seed in a test name is enough to repeat a failure.
function createRandom(seed: number): (max: number) => number {
  let state = seed
  return max => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * max)
  }
}

interface Graph {
  auto: ReadableAtom<number>[]
  explicit: ReadableAtom<number>[]
  expected(index: number): number
  sources: WritableAtom<number>[]
}

// Node reads the first input and then only one of the other two,
// so get() version changes its stores when values change
function createGraph(random: (max: number) => number): Graph {
  let sources = Array.from({ length: SOURCES }, () => atom(random(4)))
  let inputs: number[][] = []
  let auto: ReadableAtom<number>[] = [...sources]
  let explicit: ReadableAtom<number>[] = [...sources]

  let expected = (index: number): number => {
    let source = sources[index]
    if (source) return source.get()
    let [a, b, c] = inputs[index]!
    return (expected(a!) % 2 ? expected(b!) : expected(c!)) + index
  }

  for (let index = SOURCES; index < SOURCES + NODES; index++) {
    let [a, b, c] = [random(index), random(index), random(index)]
    inputs[index] = [a, b, c]
    let [$a, $b, $c] = [auto[a]!, auto[b]!, auto[c]!]
    auto.push(computed(get => (get($a) % 2 ? get($b) : get($c)) + index))
    explicit.push(
      computed(
        [explicit[a]!, explicit[b]!, explicit[c]!],
        (first, second, third) => (first % 2 ? second : third) + index
      )
    )
  }

  return { auto, explicit, expected, sources }
}

for (let seed = 1; seed <= GRAPHS; seed++) {
  test(`random graph ${seed}`, () => {
    let random = createRandom(seed)
    let { auto, explicit, expected, sources } = createGraph(random)
    let total = SOURCES + NODES
    let unbinds = new Map<number, () => void>()
    let autoLog: string[] = []
    let explicitLog: string[] = []
    let seenByAuto = new Map<number, number>()
    let seenByExplicit = new Map<number, number>()

    let toggleListener = (index: number): void => {
      let unbind = unbinds.get(index)
      if (unbind) {
        unbind()
        unbinds.delete(index)
        return
      }
      seenByAuto.set(index, auto[index]!.get())
      seenByExplicit.set(index, explicit[index]!.get())
      let unbindAuto = auto[index]!.listen(value => {
        equal(value, expected(index), `auto listener of ${index}`)
        seenByAuto.set(index, value)
        autoLog.push(`${index}=${value}`)
      })
      let unbindExplicit = explicit[index]!.listen(value => {
        equal(value, expected(index), `explicit listener of ${index}`)
        seenByExplicit.set(index, value)
        explicitLog.push(`${index}=${value}`)
      })
      unbinds.set(index, () => {
        unbindAuto()
        unbindExplicit()
      })
    }

    let watched = SOURCES + random(NODES)
    let effectRuns = 0
    let stopEffect = effect(get => {
      effectRuns += 1
      equal(get(auto[watched]!), expected(watched), 'value inside effect')
    })

    let check = (): void => {
      for (let index = SOURCES; index < total; index++) {
        equal(auto[index]!.get(), expected(index), `auto ${index}`)
        equal(explicit[index]!.get(), expected(index), `explicit ${index}`)
      }
    }

    check()
    for (let step = 0; step < STEPS; step++) {
      let action = random(6)
      if (action < 2) {
        sources[random(SOURCES)]!.set(random(4))
      } else if (action === 2) {
        batch(() => {
          sources[random(SOURCES)]!.set(random(4))
          let index = SOURCES + random(NODES)
          equal(auto[index]!.get(), expected(index), `auto ${index} in batch`)
          equal(
            explicit[index]!.get(),
            expected(index),
            `explicit ${index} in batch`
          )
          sources[random(SOURCES)]!.set(random(4))
        })
      } else if (action === 3) {
        toggleListener(SOURCES + random(NODES))
      } else if (action === 4) {
        clock.tick(random(1500))
      } else {
        let index = SOURCES + random(NODES)
        equal(auto[index]!.get(), expected(index), `auto ${index} single read`)
      }
      check()
      for (let index of unbinds.keys()) {
        equal(seenByAuto.get(index), expected(index), `auto missed ${index}`)
        equal(
          seenByExplicit.get(index),
          expected(index),
          `explicit missed ${index}`
        )
      }
      // Explicit stores read unused branches too. A read inside batch() can
      // give them a temporary value and an extra call of a listener.
      let extra = [...explicitLog]
      for (let item of autoLog) {
        let position = extra.indexOf(item)
        ok(~position, `auto has extra call ${item}`)
        extra.splice(position, 1)
      }
    }

    let runsBeforeStop = effectRuns
    stopEffect()
    for (let unbind of unbinds.values()) unbind()
    clock.tick(60_000)
    sources[0]!.set(sources[0]!.get() + 1)
    equal(effectRuns, runsBeforeStop)
    for (let $source of sources) equal($source.lc, 0)
  })
}

test.after(() => {
  clock.uninstall()
})
