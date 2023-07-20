import { test } from 'uvu'
import { equal, throws } from 'uvu/assert'

import {
  action,
  allTasks,
  atom,
  computed,
  createContext,
  keepMount,
  lastAction,
  onNotify,
  onSet,
  onStart,
  resetContext,
  startTask,
  task,
  withContext
} from '../index.js'

test.after(() => {
  resetContext()
})

test('creating a context pollutes the global context', () => {
  let $counter = atom(0)

  equal($counter.get(), 0)
  equal($counter.value, 0)

  $counter.set(321)
  equal($counter.get(), 321)
  equal($counter.value, 321)

  let ctx1 = createContext('')
  throws($counter.get)
  throws(() => $counter.value)

  equal(withContext($counter, ctx1).value, 0)
})

test('change to context takes effect', () => {
  let $counter = atom(0)

  let ctx1 = createContext('ctx1')
  let ctx2 = createContext('ctx2')

  withContext($counter, ctx1).set(2)
  withContext($counter, ctx2).set(4)

  throws($counter.get)

  equal(withContext($counter, ctx1).value, 2)
  equal(withContext($counter, ctx2).value, 4)

  equal(withContext($counter, ctx1), withContext($counter, ctx1))
})

test('basic `onStart` lifecycling', () => {
  let $counter = atom(0)

  let events: (number | undefined)[] = []
  let startCalls = 0
  onStart($counter, ({ ctx }) => {
    startCalls++
    events.push(ctx($counter).value)
  })

  let ctx1 = createContext('ctx1')
  let ctx2 = createContext('ctx2')

  let $counter1 = withContext($counter, ctx1)
  let $counter2 = withContext($counter, ctx2)
  $counter1.set(2)
  $counter2.set(4)

  keepMount($counter1)
  equal(startCalls, 1)

  keepMount($counter2)
  equal(startCalls, 2)

  equal(events, [2, 4])
})

test('basic `onSet` lifecycling', () => {
  let $counter = atom(0)

  let events: (number | undefined)[] = []
  let setCalls = 0
  onSet($counter, ({ newValue }) => {
    setCalls++
    events.push(newValue)
  })

  let ctx1 = createContext('ctx1')
  let ctx2 = createContext('ctx2')

  let $counter1 = withContext($counter, ctx1)
  let $counter2 = withContext($counter, ctx2)
  $counter1.set(2)
  equal(setCalls, 1)
  equal(events, [2])

  $counter2.set(4)
  equal(setCalls, 2)
  equal(events, [2, 4])
})

test('basic `computed` work', () => {
  let $one = atom(0)
  let $two = atom(0)

  let $cmp = computed([$one, $two], (one, two) => one + two)

  let ctx1 = createContext('ctx1')
  let ctx2 = createContext('ctx2')

  let events: number[] = []
  withContext($cmp, ctx1).subscribe(v => events.push(v))
  withContext($one, ctx1).set(5)
  withContext($two, ctx1).set(5)

  withContext($one, ctx2).set(10)
  withContext($two, ctx2).set(10)

  equal(events, [0, 5, 10])
  equal(withContext($cmp, ctx2).get(), 20)
})

test('basic `task` work', async () => {
  let ctx1 = createContext('ctx1')
  let ctx2 = createContext('ctx2')

  let track = ''

  async function taskA(): Promise<void> {
    let end = startTask(ctx1)
    setTimeout(() => {
      taskB()
      track += 'a'
      end()
    }, 100)
  }

  async function taskB(): Promise<void> {
    let result = await task(async () => {
      await Promise.resolve()
      track += 'b'
      return 5
    }, ctx1)
    equal(result, 5)
  }

  taskA()

  await allTasks(ctx2)
  equal(track, '')
  await allTasks(ctx1)
  equal(track, 'ab')
})

test('basic `action` work', async () => {
  let events: (string | undefined)[] = []
  let $atom = atom(0)

  let ctx1 = createContext('ctx1')
  let ctx2 = createContext('ctx2')

  onNotify($atom, ({ ctx }) => {
    let $withCtx = ctx($atom)
    events.push(($withCtx as any).ctx.id, $withCtx[lastAction])
  })

  let setProp = action($atom, 'setProp', (s, num: number) => {
    s.set(num)
  })

  setProp(1, ctx1)
  setProp(2, ctx2)
  equal(withContext($atom, ctx1).get(), 1)
  equal(withContext($atom, ctx2).get(), 2)

  equal(events, ['ctx1', 'setProp', 'ctx2', 'setProp'])
})

test.run()
