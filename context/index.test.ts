import { delay } from 'nanodelay'
import { test } from 'uvu'
import { equal, is, throws } from 'uvu/assert'

import {
  action,
  allTasks,
  atom,
  computed,
  createContext,
  createLocalContext,
  globalContext,
  keepMount,
  lastAction,
  onAction,
  onMount,
  onNotify,
  onSet,
  onStart,
  onStop,
  resetContext,
  serializeContext,
  startTask,
  task,
  withContext
} from '../index.js'

test.after(() => {
  resetContext()
})

// Helper function for debugging the origin of a context
function namedCtx(name: string): any {
  let ctx = createContext()
  ;(ctx as any).id = name
  return ctx
}

test('traversing from local to global context', () => {
  let $global = atom(1)
  equal($global.get(), 1)
  $global.set(2)
  equal(withContext($global, globalContext).get(), 2)

  let localCtx = createLocalContext(globalContext, 'local1')
  equal(withContext($global, localCtx).get(), 2)

  let $local = atom(1)
  withContext($local, localCtx)

  throws(() => $local.get(), /access an atom tied to a custom context/)
})

test('traversing from a deep local to custom context', () => {
  let ctx1 = createContext()
  let ctx2 = createContext()
  let $custom = atom(1)
  let $custom1 = withContext($custom, ctx1)
  let $custom2 = withContext($custom, ctx2)
  $custom1.set(2)

  let localCtx1 = createLocalContext(ctx1, 'local1')
  let localCtx2 = createLocalContext(localCtx1, 'local2')
  let localCtx3 = createLocalContext(localCtx2, 'local3')
  let localCtx4 = createLocalContext(localCtx3, 'local4')

  equal(withContext($custom1, localCtx4).get(), 2)

  equal($custom2.get(), 1)
})

test('traversing incorrect tree leads to error', () => {
  let ctx1 = createContext()
  let $custom = atom(1)
  withContext($custom, ctx1)

  let localCtx = createLocalContext(globalContext, 'local1')
  throws(
    () => withContext($custom, localCtx),
    /access an atom tied to a custom context/
  )
})

test(`you can't change base context that an atom uses`, () => {
  let $global = atom(0)
  let $custom = atom(1)
  let $local = atom(2)

  let ctx1 = createContext()
  let localCtx1 = createLocalContext(ctx1, 'local1')
  let localGlobalCtx1 = createLocalContext(globalContext, 'local-global-1')

  let ctx2 = createContext()
  let localCtx2 = createLocalContext(ctx2, 'local2')

  /*
   * The logic is rather simple:
   * 1. global atom must always remain global. It's fixed after first call
   * of .get or .listen
   */
  equal($global.get(), 0)
  throws(() => withContext($global, ctx1))
  throws(() => withContext($global, localCtx1))
  equal($global.get(), 0)

  /*
   * 2. custom and local atoms must always retain their type. It's fixed
   * after first usage of `withContext`
   */
  equal(withContext($custom, ctx1).get(), 1)
  equal(withContext($custom, ctx2).get(), 1)
  throws($custom.get)

  equal(withContext($local, localCtx1).get(), 2)
  equal(withContext($local, localCtx2).get(), 2)
  throws($local.get)
  throws(() => withContext($local, ctx1))

  /*
   * 3. you can call `withContext` with a local context on an atom that is tied to
   * this context's parent: e.g., local -> custom or local -> global. It will
   * transparently call the parent instead of the local one.
   */
  equal(withContext($global, localGlobalCtx1).get(), 0)
  throws(() => withContext($global, localCtx1), /tree of contexts/)

  equal(withContext($custom, localCtx1).get(), 1)
  throws(
    () => withContext($custom, localGlobalCtx1),
    /access an atom tied to a custom context/
  )
})

test(`cloned atom's functions retain clone's context`, () => {
  let $counter = atom(0)

  let ctx1 = createContext()
  let $counterCtx = withContext($counter, ctx1)

  // Destructure to, theoretically, lose context completely
  let { get, listen, set, subscribe } = $counterCtx

  set(123)
  equal(get(), 123)

  let events: number[] = []
  listen(v => events.push(v))
  subscribe(v => events.push(v))
  // @ts-expect-error: notify exists there
  $counterCtx.notify()

  equal(events, [123, 123, 123])
})

test('change to context takes effect', () => {
  let $counter = atom(0)

  let ctx1 = createContext()
  let ctx2 = createContext()

  withContext($counter, ctx1).set(2)
  withContext($counter, ctx2).set(4)

  throws($counter.get)

  equal(withContext($counter, ctx1).value, 2)
  equal(withContext($counter, ctx2).value, 4)

  resetContext(ctx1)

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

  let ctx1 = createContext()
  let ctx2 = createContext()

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

  let ctx1 = createContext()
  let ctx2 = createContext()

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

  let ctx1 = createContext()
  let ctx2 = createContext()

  let events: number[] = []
  withContext($cmp, ctx1).subscribe(v => events.push(v))
  withContext($one, ctx1).set(5)
  withContext($two, ctx1).set(5)

  withContext($one, ctx2).set(10)
  withContext($two, ctx2).set(10)

  equal(events, [0, 5, 10])
  equal(withContext($cmp, ctx2).get(), 20)
})

test('you can mix up local and global/custom atom in a single `computed`', () => {
  let $custom = atom(1)
  let $local = atom(2)
  let $cmp = computed([$custom, $local], (one, two) => one + two)

  let ctx1 = createContext()
  let localCtx1 = createLocalContext(ctx1, 'local1')

  let ctx2 = createContext()
  let localCtx2 = createLocalContext(ctx2, 'local2')

  // Marking those with their respective types
  withContext($custom, ctx1).set(10)
  withContext($local, localCtx1).set(20)

  equal(withContext($cmp, localCtx1).get(), 30)
  equal(withContext($cmp, localCtx2).get(), 3)
})

test('basic `task` work', async () => {
  let ctx1 = createContext()
  let ctx2 = createContext()

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

  let ctx1 = namedCtx('ctx1')
  let ctx2 = namedCtx('ctx2')

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

test('action works with `withContext`', async () => {
  let events: (string | undefined)[] = []
  let $atom = atom(0)

  let ctx1 = namedCtx('ctx1')
  let ctx2 = namedCtx('ctx2')

  onNotify($atom, ({ ctx }) => {
    let $withCtx = ctx($atom)
    events.push(($withCtx as any).ctx.id, $withCtx[lastAction])
  })

  let setProp = action($atom, 'setProp', (s, num: number) => {
    s.set(num)
  })

  // Retains identity between calls
  is(withContext(setProp, ctx1), withContext(setProp, ctx1))

  withContext(setProp, ctx1)(1)
  withContext(setProp, ctx2)(2)

  equal(withContext($atom, ctx1).get(), 1)
  equal(withContext($atom, ctx2).get(), 2)

  equal(events, ['ctx1', 'setProp', 'ctx2', 'setProp'])
})

test('all lifecycles accept `ctx`', async () => {
  let $atom = atom(0)

  let ctx1 = namedCtx('ctx1')
  let ctx2 = namedCtx('ctx2')

  let events: string[] = []
  let push =
    (type: string) =>
    ({ ctx }: any) => {
      events.push(`${type}_${ctx($atom).ctx.id}`)
    }
  onNotify($atom, push('notify'))
  onNotify($atom, push('notify'))
  onSet($atom, push('set'))
  onSet($atom, push('set'))
  onStart($atom, push('start'))
  onStart($atom, push('start'))
  onStop($atom, push('stop'))
  onMount($atom, push('mount'))
  onStop($atom, push('stop'))
  onMount($atom, push('mount'))
  onMount($atom, push('mount'))
  onStop($atom, push('stop'))
  onAction($atom, push('action'))
  onAction($atom, push('action'))

  let changeValue = action($atom, 'change', ($store, value: number) => {
    $store.set(value)
  })

  let $atom1 = withContext($atom, ctx1)
  let $atom2 = withContext($atom, ctx2)

  let unbind1 = $atom1.listen(() => {})
  let unbind2 = $atom2.listen(() => {})

  changeValue(1, ctx1)
  changeValue(2, ctx2)

  unbind1()
  unbind2()

  equal(events, [
    'mount_ctx1',
    'mount_ctx1',
    'mount_ctx1',
    'start_ctx1',
    'start_ctx1',
    'mount_ctx2',
    'mount_ctx2',
    'mount_ctx2',
    'start_ctx2',
    'start_ctx2',
    'action_ctx1',
    'action_ctx1',
    'set_ctx1',
    'set_ctx1',
    'notify_ctx1',
    'notify_ctx1',
    'action_ctx2',
    'action_ctx2',
    'set_ctx2',
    'set_ctx2',
    'notify_ctx2',
    'notify_ctx2',
    'stop_ctx1',
    'stop_ctx1',
    'stop_ctx1',
    'stop_ctx2',
    'stop_ctx2',
    'stop_ctx2'
  ])
})

test('test the whole serialization flow', async () => {
  let $atom = atom(0)
  let updateAction = action($atom, 'update', async (store, d: number) => {
    await delay(d)
    store.set(Math.random())
  })

  let ctx1 = createContext()
  let ctx2 = createContext()
  updateAction(50, ctx1)
  updateAction(10, ctx2)

  await allTasks(ctx1)
  let serializedCtx1 = serializeContext(ctx1)
  let ctx1GenNumber = withContext($atom, ctx1).get()
  let serializedCtx2 = serializeContext(ctx2)
  let ctx2GenNumber = withContext($atom, ctx2).get()

  resetContext()

  ctx1 = createContext(JSON.parse(serializedCtx1))
  ctx2 = createContext(JSON.parse(serializedCtx2))

  equal(withContext($atom, ctx1).get(), ctx1GenNumber)
  equal(withContext($atom, ctx2).get(), ctx2GenNumber)
})

test.run()
