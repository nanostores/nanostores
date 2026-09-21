import FakeTimers from '@sinonjs/fake-timers'
import { deepStrictEqual, equal, throws } from 'node:assert'
import { test } from 'node:test'

import {
  allTasks,
  atom,
  batch,
  batched,
  cleanStores,
  computed,
  effect,
  map,
  onMount,
  type ReadableAtom,
  STORE_UNMOUNT_DELAY,
  task
} from '../index.js'

let clock = FakeTimers.install()

test('computes value without listeners', () => {
  let calls = 0
  let $a = atom(1)
  let $b = computed(get => {
    calls += 1
    return get($a) + 1
  })
  equal($b.get(), 2)
  equal($b.get(), 2)
  equal(calls, 1)
  $a.set(2)
  equal($b.get(), 3)
  equal(calls, 2)
})

test('recomputes once in diamond', () => {
  let $store = atom(0)
  let values: string[] = []

  let $a = computed(get => `a${get($store)}`)
  let $b = computed(get => get($a).replace('a', 'b'))
  let $c = computed($a, a => a.replace('a', 'c'))
  let $d = computed(get => get($a).replace('a', 'd'))
  let $combined = computed(get => `${get($b)}${get($c)}${get($d)}`)

  let unbind = $combined.subscribe(v => values.push(v))
  deepStrictEqual(values, ['b0c0d0'])

  $store.set(1)
  $store.set(2)
  deepStrictEqual(values, ['b0c0d0', 'b1c1d1', 'b2c2d2'])
  unbind()
})

test('runs once per batch', () => {
  let calls = 0
  let $a = atom(0)
  let $b = atom(0)
  let log: string[] = []
  let $sum = computed(get => {
    calls += 1
    return `${get($a)}${get($b)}`
  })
  let unbind = $sum.subscribe(v => log.push(v))
  batch(() => {
    $a.set(1)
    $b.set(2)
    equal($sum.get(), '12')
  })
  deepStrictEqual(log, ['00', '12'])
  equal(calls, 2)
  unbind()
})

test('drops unused dependencies', () => {
  let calls = 0
  let $switcher = atom<'a' | 'b'>('a')
  let $a = atom('a1')
  let $b = atom('b1')
  let $c = computed(get => {
    calls += 1
    return get($switcher) === 'a' ? get($a) : get($b)
  })
  let log: string[] = []
  let unbind = $c.subscribe(v => log.push(v))
  equal($a.lc, 1)
  equal($b.lc, 0)

  $a.set('a2')
  $switcher.set('b')
  equal($a.lc, 0)
  equal($b.lc, 1)

  $a.set('a3')
  equal(calls, 3)

  $b.set('b2')
  deepStrictEqual(log, ['a1', 'a2', 'b1', 'b2'])
  equal(calls, 4)

  unbind()
  clock.tick(STORE_UNMOUNT_DELAY * 2)
  equal($switcher.lc, 0)
  equal($b.lc, 0)
})

test('works with a store of stores', () => {
  let $a = atom('a1')
  let $b = atom('b1')
  let $switcher = atom($a)
  let $c = computed(get => get(get($switcher)))
  let log: string[] = []
  let unbind = $c.subscribe(v => log.push(v))
  $a.set('a2')
  $switcher.set($b)
  $a.set('a3')
  $b.set('b2')
  deepStrictEqual(log, ['a1', 'a2', 'b1', 'b2'])
  unbind()
})

test('does not read dependencies reachable only with old values', () => {
  let $users = atom<Record<string, string>>({ u1: 'John', u2: 'Mary' })
  let $online = atom(['u1', 'u2'])
  let byId: Record<string, ReadableAtom<string>> = {}
  let $userById = (id: string): ReadableAtom<string> =>
    (byId[id] ||= computed(get => {
      let user = get($users)[id]
      if (!user) throw new Error(`No user ${id}`)
      return user
    }))
  let $names = computed(get =>
    get($online)
      .map(id => get($userById(id)))
      .join(' ')
  )
  let log: string[] = []
  let unbind = $names.subscribe(v => log.push(v))
  batch(() => {
    $online.set(['u1'])
    $users.set({ u1: 'John' })
  })
  $online.set([])
  deepStrictEqual(log, ['John Mary', 'John', ''])
  unbind()
})

test('does not track direct store.get()', () => {
  let calls = 0
  let $a = atom(1)
  let $b = atom(1)
  let $sum = computed(get => {
    calls += 1
    return get($a) + $b.get()
  })
  let unbind = $sum.listen(() => {})
  $b.set(2)
  equal(calls, 1)
  equal($b.lc, 0)
  $a.set(2)
  equal($sum.get(), 4)
  unbind()
})

test('throws on late get()', () => {
  let $a = atom(1)
  let $b = computed(get => () => get($a))
  throws(() => $b.get()(), /synchronously/)
})

test('reads store without subscription on late get() in production', () => {
  let $a = atom(1)
  let $b = computed(get => () => get($a))
  let unbind = $b.listen(() => {})
  let lateGet = $b.get()
  process.env.NODE_ENV = 'production'
  try {
    equal(lateGet(), 1)
  } finally {
    process.env.NODE_ENV = 'test'
  }
  equal($a.lc, 0)
  unbind()
})

test('keeps dependencies read before error', () => {
  let $a = atom(0)
  let $b = computed(get => {
    if (get($a) === 1) throw new Error('test')
    return get($a)
  })
  equal($b.get(), 0)
  $a.set(1)
  throws(() => $b.get(), /test/)
  $a.set(2)
  equal($b.get(), 2)
})

test('returns fresh value inside listener before own listener ran', () => {
  let $event = atom<string | undefined>()
  let $atom = atom(1)
  let $computed1 = computed(get => get($atom) * 2)
  let $computed2 = computed(get => get($computed1) * 3)
  $computed2.listen(() => {})
  let values: number[] = []
  $event.listen(() => {
    $atom.set(2)
    values.push($computed2.get())
  })
  $event.set('foo')
  deepStrictEqual(values, [12])
})

test('supports batched', () => {
  let $a = atom('1')
  let $b = atom('1')
  let $sum = batched(get => get($a) + get($b))
  let events = ''
  $sum.subscribe(v => (events += v))
  $a.set('2')
  $b.set('2')
  clock.runAll()
  equal(events, '1122')
})

test('effect tracks dynamic dependencies', () => {
  let $enabled = atom(true)
  let $interval = atom(100)
  let log: string[] = []
  let stop = effect(get => {
    if (!get($enabled)) {
      log.push('off')
      return
    }
    let interval = get($interval)
    log.push(`start ${interval}`)
    return () => log.push(`stop ${interval}`)
  })
  $interval.set(200)
  $enabled.set(false)
  equal($interval.lc, 0)
  $interval.set(300)
  $enabled.set(true)
  stop()
  $interval.set(400)
  deepStrictEqual(log, [
    'start 100',
    'stop 100',
    'start 200',
    'stop 200',
    'off',
    'start 300',
    'stop 300'
  ])
  equal($enabled.lc, 0)
  equal($interval.lc, 0)
})

test('effect runs once in diamond and once per batch', () => {
  let $a = atom(1)
  let $b = computed(get => get($a) * 10)
  let $c = computed(get => get($a) * 100)
  let log: number[] = []
  let stop = effect(get => {
    log.push(get($b) + get($c))
  })
  $a.set(2)
  batch(() => {
    $a.set(3)
    $a.set(4)
  })
  deepStrictEqual(log, [110, 220, 440])
  stop()
})

test('recomputes when later dependency changes earlier one on mount', () => {
  let $a = atom(0)
  let $b = atom('b')
  onMount($b, () => {
    $a.set(1)
  })
  let $c = computed(get => `${get($a)}${get($b)}`)
  equal($c.get(), '1b')
})

test('does not unwrap task in auto mode', async () => {
  let $a = atom(1)
  let $b = computed(get => task(() => Promise.resolve(get($a))))
  let value: Promise<number> = $b.get()
  equal(await value, 1)
  await allTasks()
})

test('unbinds repeated dependencies', () => {
  let $a = atom(1)
  let stop = effect([$a, $a], () => {})
  let $sum = computed([$a, $a], (a, b) => a + b)
  let unbind = $sum.listen(() => {})
  equal($a.lc, 2)
  stop()
  unbind()
  clock.tick(STORE_UNMOUNT_DELAY * 2)
  equal($a.lc, 0)
})

test('effect unbinds when first run throws', () => {
  let $a = atom(1)
  throws(() => {
    effect(get => {
      get($a)
      throw new Error('test')
    })
  }, /test/)
  equal($a.lc, 0)
})

test('rechecks when dependency check mounts a store', () => {
  let $a = atom(0)
  let $flag = atom(false)
  let $inner = atom('x')
  onMount($inner, () => {
    $a.set(1)
  })
  let $later = computed(get => (get($flag) ? get($inner) && 'b' : 'b'))
  let $c = computed(get => `${get($a)}${get($later)}`)
  let unbind = $c.listen(() => {})
  batch(() => {
    $flag.set(true)
    equal($c.get(), '1b')
  })
  unbind()
})

test('effect runs again when mounting changes earlier dependency', () => {
  let $a = atom(0)
  let $b = atom(0)
  onMount($b, () => {
    $a.set(1)
  })
  let seen: number[][] = []
  let cleanups = 0
  let stop = effect(get => {
    seen.push([get($a), get($b)])
    return () => {
      cleanups += 1
    }
  })
  deepStrictEqual(seen, [
    [0, 0],
    [1, 0]
  ])
  equal(cleanups, 1)
  stop()
})

test('effect delays nested run and keeps its cleanup', () => {
  let $a = atom(0)
  let $b = atom(0)
  let $c = atom(0)
  onMount($b, () => {
    $a.set(1)
  })
  onMount($c, () => {
    $a.set(2)
  })
  let log: string[] = []
  let stop = effect(get => {
    let a = get($a)
    get($b)
    if (a === 1) get($c)
    log.push(`run ${a}`)
    return () => log.push(`clean ${a}`)
  })
  stop()
  deepStrictEqual(log, [
    'run 0',
    'clean 0',
    'run 1',
    'clean 1',
    'run 2',
    'clean 2'
  ])
})

test('effect calls cleanup once when next run throws', () => {
  let $a = atom(0)
  let $b = atom(0)
  onMount($b, () => {
    $a.set(1)
  })
  let cleanups = 0
  throws(() => {
    effect(get => {
      if (get($a) === 1) throw new Error('test')
      get($b)
      return () => {
        cleanups += 1
      }
    })
  }, /test/)
  equal(cleanups, 1)
  equal($a.lc, 0)
  equal($b.lc, 0)
})

test('throws when callback changes own dependency on every run', () => {
  let $a = atom(0)
  let $endless = computed(get => {
    $a.set(get($a) + 1)
    return 0
  })
  throws(() => $endless.get(), /own dependencies/)

  let $b = atom(0)
  throws(() => {
    effect(get => {
      $b.set(get($b) + 1)
    })
  }, /own dependencies/)
  equal($b.lc, 0)
})

test('allows callback to change own dependency a few times', () => {
  let $a = atom(0)
  let runs = 0
  let stop = effect(get => {
    runs += 1
    if (get($a) < 10) $a.set(get($a) + 1)
  })
  equal($a.get(), 10)
  equal(runs, 11)
  stop()
})

test('effect can be stopped inside own callback', () => {
  let $a = atom(0)
  let log: string[] = []
  let stop: () => void = effect(get => {
    let a = get($a)
    log.push(`run ${a}`)
    if (a === 1) stop()
    return () => log.push(`clean ${a}`)
  })
  $a.set(1)
  $a.set(2)
  deepStrictEqual(log, ['run 0', 'clean 0', 'run 1', 'clean 1'])
  equal($a.lc, 0)
})

test('stops effect created inside effect by returned function', () => {
  let $id = atom(1)
  let $value = atom(0)
  let log: string[] = []
  let stop = effect(get => {
    let id = get($id)
    return effect(getInner => {
      log.push(`${id}:${getInner($value)}`)
    })
  })
  $value.set(1)
  $id.set(2)
  $value.set(2)
  stop()
  $value.set(3)
  deepStrictEqual(log, ['1:0', '1:1', '2:1', '2:2'])
  equal($id.lc, 0)
  equal($value.lc, 0)
})

test('supports cleanStores', () => {
  let $a = atom(1)
  let $b = computed(get => get($a) * 2)
  $b.listen(() => {})
  equal($b.get(), 2)
  cleanStores($b)
  equal($a.lc, 0)
  equal($b.lc, 0)
  $a.set(2)
  equal($b.get(), 4)
})

test('tracks map', () => {
  let $map = map({ counter: 1 })
  let $next = computed(get => get($map).counter + 1)
  let log: number[] = []
  let unbind = $next.subscribe(v => log.push(v))
  $map.setKey('counter', 2)
  $map.set({ counter: 3 })
  deepStrictEqual(log, [2, 3, 4])
  unbind()
})

test('tracks stores without eq and value', () => {
  let listeners: (() => void)[] = []
  let current = 1
  let $custom = {
    get: () => current,
    listen(listener: () => void) {
      listeners.push(listener)
      return () => {
        listeners.splice(listeners.indexOf(listener), 1)
      }
    }
  }
  let $unrelated = atom(0)
  let $mounted = atom(0)
  onMount($mounted, () => {
    // New epoch forces a check of saved values after the run
    $unrelated.set(1)
  })
  let log: string[] = []
  let stop = effect(get => {
    log.push(`${get($custom)} ${get($mounted)}`)
  })
  current = 3
  for (let listener of listeners) listener()
  stop()
  deepStrictEqual(log, ['1 0', '3 0'])
  equal(listeners.length, 0)
})

test('updates in batch after a dependency was dropped inside it', () => {
  let $a = atom(1)
  let $b = atom(0)
  let $copy = computed(get => get($a))
  let $result = computed(get =>
    get($copy) % 2 ? get($a) + 10 : get($b) + 20
  )
  let log: number[] = []
  let unbind = $result.listen(value => log.push(value))
  batch(() => {
    $a.set(0)
    // Drops $a here. Atom removes a queued call of its listener,
    // but batch() still remembers this listener as queued.
    equal($result.get(), 20)
    $a.set(1)
  })
  equal($result.get(), 11)
  deepStrictEqual(log, [11])
  unbind()
})

test('effect stopped inside callback does not listen to new stores', () => {
  let $flag = atom(false)
  let $other = atom(0)
  let stop: () => void = effect(get => {
    if (get($flag)) {
      stop()
      get($other)
    }
  })
  $flag.set(true)
  equal($flag.lc, 0)
  equal($other.lc, 0)
})

test('sees a change behind computed store made by mount of later store', () => {
  let $a = atom(0)
  let $x = computed($a, a => a * 10)
  let $inner = atom('i')
  onMount($inner, () => {
    $a.set(1)
  })
  let $later = computed($inner, () => 'b')
  let $c = computed(get => `${get($x)}${get($later)}`)
  equal($c.get(), '10b')
})

test('keeps stores, which were not reached because of an error', () => {
  let $p = atom(1)
  let $q = atom(2)
  let fail = false
  let $sum = computed(get => {
    let p = get($p)
    if (fail) throw new Error('test')
    return p + get($q)
  })
  equal($sum.get(), 3)
  fail = true
  $p.set(9)
  throws(() => $sum.get(), /test/)
  fail = false
  $q.set(100)
  equal($sum.get(), 109)

  let $a = atom(1)
  let $b = atom(2)
  let seen: number[] = []
  let stop = effect(get => {
    let a = get($a)
    if (fail) throw new Error('test')
    seen.push(a + get($b))
  })
  fail = true
  throws(() => {
    $a.set(9)
  }, /test/)
  equal($b.lc, 1)
  fail = false
  $b.set(100)
  deepStrictEqual(seen, [3, 109])
  stop()
  equal($a.lc, 0)
  equal($b.lc, 0)
})

test('works with callback, which reads no stores', () => {
  let calls = 0
  let $constant = computed(() => {
    calls += 1
    return 5
  })
  equal($constant.get(), 5)
  let unbind = $constant.listen(() => {})
  let $other = atom(0)
  $other.set(1)
  equal($constant.get(), 5)
  equal(calls, 1)
  unbind()

  let runs = 0
  let stop = effect(() => {
    runs += 1
  })
  $other.set(2)
  equal(runs, 1)
  stop()
})

test('listens again to a store, which was dropped before', () => {
  let $flag = atom(true)
  let $a = atom('a1')
  let calls = 0
  let $value = computed(get => {
    calls += 1
    return get($flag) ? get($a) : 'none'
  })
  let log: string[] = []
  let unbind = $value.subscribe(v => log.push(v))
  $flag.set(false)
  equal($a.lc, 0)
  $a.set('a2')
  equal(calls, 2)
  $flag.set(true)
  equal($a.lc, 1)
  $a.set('a3')
  deepStrictEqual(log, ['a1', 'none', 'a2', 'a3'])
  equal(calls, 4)
  unbind()
})

test('batched unbinds from stores after unmount', () => {
  let $a = atom(1)
  let $b = atom(1)
  let calls = 0
  let $sum = batched(get => {
    calls += 1
    return get($a) + get($b)
  })
  let unbind = $sum.listen(() => {})
  equal($a.lc, 1)
  equal($b.lc, 1)
  $a.set(2)
  unbind()
  clock.runAll()
  equal($a.lc, 0)
  equal($b.lc, 0)
  equal($sum.lc, 0)
  let callsAfterUnmount = calls
  $b.set(2)
  clock.runAll()
  equal(calls, callsAfterUnmount)
  equal($sum.get(), 4)
})

test('does not call callbacks of a chain without listeners', () => {
  let $users = atom<Record<string, string>>({ u1: 'Ann' })
  let userCalls = 0
  let $user = computed($users, users => {
    userCalls += 1
    if (!users.u1) throw new Error('No user u1')
    return users.u1
  })
  let $upper = computed(get => get($user).toUpperCase())
  let unbind = $upper.listen(() => {})
  equal(userCalls, 1)

  unbind()
  equal($user.lc, 0)
  equal($users.lc, 0)
  $users.set({})
  equal(userCalls, 1)

  $users.set({ u1: 'Bob' })
  equal($upper.get(), 'BOB')
  equal(userCalls, 2)
})

test('does not listen to stores on get() without listeners', () => {
  let $a = atom(1)
  let $double = computed(get => get($a) * 2)
  equal($double.get(), 2)
  equal($a.lc, 0)
  $a.set(2)
  equal($double.get(), 4)
  equal($a.lc, 0)
})

test('batched does not call callback after the last listener left', () => {
  let $users = atom<Record<string, string>>({ u1: 'Ann' })
  let calls = 0
  let $user = batched(get => {
    calls += 1
    let user = get($users).u1
    if (!user) throw new Error('No user u1')
    return user
  })
  let unbind = $user.listen(() => {})
  $users.set({ u1: 'Bob' })
  unbind()
  $users.set({})
  clock.runAll()
  equal(calls, 1)
})

test('calls callback again after an error without a store change', () => {
  let $a = atom(1)
  let $unrelated = atom(0)
  let calls = 0
  let $b = computed(get => {
    calls += 1
    if (get($a) === 1) throw new Error('test')
    return get($a)
  })
  throws(() => $b.get(), /test/)
  throws(() => $b.get(), /test/)
  equal(calls, 2)
  $unrelated.set(1)
  throws(() => $b.get(), /test/)
  equal(calls, 3)
  $a.set(2)
  equal($b.get(), 2)
  equal(calls, 4)
})

test('does not listen to stores if callback throws for first listener', () => {
  let $a = atom(1)
  let $b = computed(get => {
    if (get($a) === 1) throw new Error('test')
    return get($a)
  })
  throws(() => $b.listen(() => {}), /test/)
  equal($a.lc, 0)
  equal($b.lc, 0)

  $a.set(2)
  let values: number[] = []
  let unbind = $b.listen(value => {
    values.push(value)
  })
  equal($a.lc, 1)
  $a.set(3)
  deepStrictEqual(values, [3])
  unbind()
})

test('effect runs again after an error without a store change', () => {
  let $a = atom(0)
  let calls = 0
  let stop = effect(get => {
    calls += 1
    if (get($a) === 1) throw new Error('test')
  })
  throws(() => {
    $a.set(1)
  }, /test/)
  throws(() => {
    $a.notify()
  }, /test/)
  equal(calls, 3)
  $a.set(2)
  equal(calls, 4)
  stop()
  equal($a.lc, 0)
})

test.after(() => {
  clock.uninstall()
})
