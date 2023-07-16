import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers'
import { test } from 'uvu'
import { equal, ok } from 'uvu/assert'

import {
  atom,
  computed,
  getTask,
  onMount,
  STORE_UNMOUNT_DELAY,
  type StoreValue
} from '../index.js'
import {
  type ErrorPayload,
  finishMicrotask,
  type Loading,
  type Person,
  Response,
  type SearchMessage
} from './testLib.js'

let clock: InstalledClock

test.before(() => {
  clock = FakeTimers.install()
})

test.after(() => {
  clock.uninstall()
})

test('converts stores values', () => {
  let $letter = atom<{ letter: string }>({ letter: 'a' })
  let $number = atom<{ number: number }>({ number: 0 })

  let renders = 0
  let $combine = computed([$letter, $number], (letterValue, numberValue) => {
    renders += 1
    return `${letterValue.letter} ${numberValue.number}`
  })
  equal(renders, 0)

  let value: StoreValue<typeof $combine> = ''
  let unbind = $combine.subscribe(combineValue => {
    value = combineValue
  })
  equal(value, 'a 0')
  equal(renders, 1)

  $letter.set({ letter: 'b' })
  equal(value, 'b 0')
  equal(renders, 2)

  $number.set({ number: 1 })
  equal(value, 'b 1')
  equal(renders, 3)

  unbind()
  clock.runAll()
  equal(value, 'b 1')
  equal(renders, 3)
})

test('works with single store', () => {
  let $number = atom<number>(1)
  let $decimal = computed($number, count => {
    return count * 10
  })

  let value
  let unbind = $decimal.subscribe(decimalValue => {
    value = decimalValue
  })
  equal(value, 10)

  $number.set(2)
  equal(value, 20)

  unbind()
})

let replacer: (...args: [string, string]) => (v: string) => string =
  (...args: [string, string]) =>
    (v: string) =>
      v.replace(...args)

test('prevents diamond dependency problem 1', () => {
  let $store = atom<number>(0)
  let values: string[] = []

  let $a = computed($store, v => `a${v}`)
  let $b = computed($a, replacer('a', 'b'))
  let $c = computed($a, replacer('a', 'c'))
  let $d = computed($a, replacer('a', 'd'))

  let $combined = computed([$b, $c, $d], (b, c, d) => `${b}${c}${d}`)

  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  equal(values, ['b0c0d0'])

  $store.set(1)
  $store.set(2)

  equal(values, ['b0c0d0', 'b1c1d1', 'b2c2d2'])

  unsubscribe()
})

test('prevents diamond dependency problem 2', () => {
  let $store = atom<number>(0)
  let values: string[] = []

  let $a = computed($store, v => `a${v}`)
  let $b = computed($a, replacer('a', 'b'))
  let $c = computed($b, replacer('b', 'c'))
  let $d = computed($c, replacer('c', 'd'))
  let $e = computed($d, replacer('d', 'e'))

  let $combined = computed([$a, $e], (...args) => args.join(''))

  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  equal(values, ['a0e0'])

  $store.set(1)
  equal(values, ['a0e0', 'a1e1'])

  unsubscribe()
})

test('prevents diamond dependency problem 3', () => {
  let $store = atom<number>(0)
  let values: string[] = []

  let $a = computed($store, store => `a${store}`)
  let $b = computed($a, replacer('a', 'b'))
  let $c = computed($b, replacer('b', 'c'))
  let $d = computed($c, replacer('c', 'd'))

  let $combined = computed(
    [$a, $b, $c, $d],
    (a, b, c, d) => `${a}${b}${c}${d}`
  )

  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  equal(values, ['a0b0c0d0'])

  $store.set(1)
  equal(values, ['a0b0c0d0', 'a1b1c1d1'])

  unsubscribe()
})

test('prevents diamond dependency problem 4 (complex)', () => {
  let $store1 = atom<number>(0)
  let $store2 = atom<number>(0)
  let values: string[] = []

  let fn =
    (name: string) =>
    (...v: (number | string)[]) =>
      `${name}${v.join('')}`

  let $a = computed($store1, fn('a'))
  let $b = computed($store2, fn('b'))

  let $c = computed([$a, $b], fn('c'))
  let $d = computed($a, fn('d'))

  let $e = computed([$c, $d], fn('e'))

  let $f = computed($e, fn('f'))
  let $g = computed($f, fn('g'))

  let $combined1 = computed($e, (...args) => args.join(''))
  let $combined2 = computed([$e, $g], (...args) => args.join(''))

  let unsubscribe1 = $combined1.subscribe(v => {
    values.push(v)
  })

  let unsubscribe2 = $combined2.subscribe(v => {
    values.push(v)
  })

  equal(values, ['eca0b0da0', 'eca0b0da0gfeca0b0da0'])

  $store1.set(1)
  $store2.set(2)

  equal(values, [
    'eca0b0da0',
    'eca0b0da0gfeca0b0da0',
    'eca1b0da1',
    'eca1b0da1gfeca1b0da1',
    'eca1b2da1',
    'eca1b2da1gfeca1b2da1'
  ])

  unsubscribe1()
  unsubscribe2()
})

test('prevents diamond dependency problem 5', () => {
  let events = ''
  let $firstName = atom('John')
  let $lastName = atom('Doe')
  let $fullName = computed([$firstName, $lastName], (first, last) => {
    events += 'full '
    return `${first} ${last}`
  })
  let $isFirstShort = computed($firstName, name => {
    events += 'short '
    return name.length < 10
  })
  let $displayName = computed(
    [$firstName, $isFirstShort, $fullName],
    (first, isShort, full) => {
      events += 'display '
      return isShort ? full : first
    }
  )

  equal(events, '')

  $displayName.listen(() => {})
  equal($displayName(), 'John Doe')
  equal(events, 'short full display ')

  $firstName.set('Benedict')
  equal($displayName(), 'Benedict Doe')
  equal(events, 'short full display short full display ')

  $firstName.set('Montgomery')
  equal($displayName(), 'Montgomery')
  equal(events, 'short full display short full display short full display ')
})

test('prevents diamond dependency problem 6', () => {
  let $store1 = atom<number>(0)
  let $store2 = atom<number>(0)
  let values: string[] = []

  let $a = computed($store1, v => `a${v}`)
  let $b = computed($store2, v => `b${v}`)
  let $c = computed($b, v => v.replace('b', 'c'))

  let $combined = computed([$a, $c], (a, c) => `${a}${c}`)

  let unsubscribe = $combined.subscribe(v => {
    values.push(v)
  })

  equal(values, ['a0c0'])

  $store1.set(1)
  equal(values, ['a0c0', 'a1c0'])

  unsubscribe()
})

test('prevents dependency listeners from being out of order', () => {
  let $base = atom(0)
  let $a = computed($base, base => {
    return `${base}a`
  })
  let $b = computed($a, a => {
    return `${a}b`
  })

  equal($b(), '0ab')
  let values: string[] = []
  let unsubscribe = $b.subscribe(b => values.push(b))
  equal(values, ['0ab'])

  clock.tick(STORE_UNMOUNT_DELAY * 2)
  equal($a(), '0a')
  $base.set(1)
  equal(values, ['0ab', '1ab'])

  unsubscribe()
})

test('notifies when stores change within the same notifyId', () => {
  let $val = atom(1)

  let $computed1 = computed($val, val => {
    return val
  })

  let $computed2 = computed($computed1, computed1 => {
    return computed1
  })

  let events: any[] = []
  $val.subscribe(val => events.push({ val }))
  $computed2.subscribe(computed2 => {
    events.push({ computed2 })
    if (computed2 % 2 === 1) {
      $val.set($val() + 1)
    }
  })

  equal(events, [{ val: 1 }, { computed2: 1 }, { val: 2 }, { computed2: 2 }])

  $val.set(3)
  equal(events, [
    { val: 1 },
    { computed2: 1 },
    { val: 2 },
    { computed2: 2 },
    { val: 3 },
    { computed2: 3 },
    { val: 4 },
    { computed2: 4 }
  ])
})

test('is compatible with onMount', () => {
  let $store = atom(1)
  let $deferrer = computed($store, value => value * 2)

  let events = ''
  onMount($deferrer, () => {
    events += 'init '
    return () => {
      events += 'destroy '
    }
  })
  equal(events, '')

  let deferrerValue: number | undefined
  let unbind = $deferrer.subscribe(value => {
    deferrerValue = value
  })
  clock.runAll()
  ok($deferrer.lc > 0)
  equal($deferrer(), $store() * 2)
  equal(deferrerValue, $store() * 2)
  ok($store.lc > 0)
  equal(events, 'init ')

  $store.set(3)
  equal($deferrer(), $store() * 2)
  equal(deferrerValue, $store() * 2)

  unbind()
  clock.runAll()
  equal($deferrer.lc, 0)
  equal(events, 'init destroy ')
})

test('computes initial value when argument is undefined', () => {
  let $one = atom<string | undefined>(undefined)
  let $two = computed($one, value => !!value)
  equal($one(), undefined)
  equal($two(), false)
})

test('task() returns current value of computed', () => {
  let $one = atom<string | undefined>(undefined)
  let useValues: (boolean|undefined)[] = []
  let $two = computed($one, one => {
    useValues.push(getTask<boolean | undefined>()())
    return !!one
  })
  equal($one(), undefined)
  equal(useValues, [])

  equal($two(), false)
  equal(useValues, [undefined])

  $one.set('foobar')
  equal($two(), true)
  equal(useValues, [undefined, false])
})

test('async api', async () => {
  let cbCount = 0
  let fetchCount = 0
  let $personId = atom<null | number>(null)
  let $search = atom<null | string>(null)
  let $personOpCount = atom(0)
  let $deactivate = atom<boolean>(false)
  let $personAndSearchMessages = computed([
    $personId, $search
  ], async (
    personId, search, ...rest
  ) => {
    cbCount++
    if ((rest as any).length) throw new Error('rest should be empty')
    let task = getTask()
    if ($deactivate()) return task.undo()
    if (!$personId()) return null
    let $dirty = computed(() =>
      personId !== $personId() || (search && search !== $search()))
    let $cancel = computed(() =>
      $deactivate() || $dirty())
    let person: ErrorPayload | Loading | null | Person =
      task() && task()!.personId === personId && !task()!.person?.loading
      ? task()!.person!
      : null
    if (!person) {
      task.set({
        person: {
          loading: true,
          message: `loading person ${personId}`
        },
        personId
      })
      $personOpCount.set($personOpCount.get() + 1) // .get() is called so no circular dependency
      person =
        await fetch(`https://www.example.com/people/${personId}`).then(response =>
          response.json())
      if ((<ErrorPayload>person)!.error || $cancel()) return task.undo()
    }
    search = $search(task)
    let personAndNull = {
      person: <Person>person,
      personId,
      search,
      searchMessages: null
    }
    if (!search) return personAndNull
    let searchMessages: ErrorPayload | Loading | null | SearchMessage[] =
      task()!.search === search
      ? task()!.searchMessages ?? null
      : null
    if (!searchMessages) {
      task.save({
        person: <Person>person,
        personId,
        search,
        searchMessages: {
          loading: true,
          message: `loading messages ${search}`
        }
      })
    }
    search = $search()
    if (!search) return null
    task.set({
      person: <Person>person,
      personId,
      search,
      searchMessages: {
        loading: true,
        message: `loading messages ${search}`
      }
    })
    searchMessages = await fetch(`https://www.example.com/people/${$personId()}/messages/${$search()}`).then(response =>
      response.json())
    if (!searchMessages || (<ErrorPayload>searchMessages).error || $cancel()) {
      return personAndNull
    }
    return {
      person: <Person>person,
      personId,
      search,
      searchMessages: <SearchMessage[]>searchMessages
    }
  })

  let noop:() => void = () => {}
  let off: () => void

  equal(cbCount, 0)
  equal(fetchCount, 0)
  equal($personAndSearchMessages.get(), undefined)

  $deactivate.set(false)
  equal(cbCount, 1)
  equal(fetchCount, 0)
  equal($personAndSearchMessages.get(), undefined)
  await finishMicrotask()
  equal($personAndSearchMessages.get(), null)

  $personId.set(1)
  equal(cbCount, 2)
  equal(fetchCount, 1)
  equal($personAndSearchMessages.get(), loadingPerson(1))
  await finishMicrotask()
  $personId.set(-1)
  equal(cbCount, 3)
  equal(fetchCount, 2)
  equal($personAndSearchMessages.get(), loadingPerson(-1))
  await finishMicrotask()
  equal($personAndSearchMessages.get(), loadingPerson(-1))
  await finishMicrotask()
  equal($personAndSearchMessages.get(), null)
  await finishMicrotask()
  equal($personAndSearchMessages.get(), null)

  $personId.set(1)
  equal(cbCount, 4)
  equal(fetchCount, 3)
  equal($personAndSearchMessages.get(), loadingPerson(1))
  await finishMicrotask()
  equal($personAndSearchMessages.get(), loadingPerson(1))
  $deactivate.set(true)
  equal(cbCount, 5)
  equal(fetchCount, 3)
  equal($personAndSearchMessages.get(), null)
  await finishMicrotask()
  equal($personAndSearchMessages.get(), null)
  await finishMicrotask()
  equal($personAndSearchMessages.get(), null)

  $deactivate.set(false)
  equal(cbCount, 6)
  equal(fetchCount, 4)
  equal($personAndSearchMessages.get(), loadingPerson(1))
  await finishMicrotask()
  equal($personAndSearchMessages.get(), loadingPerson(1))
  await finishMicrotask()
  equal($personAndSearchMessages.get(), person1NullSearch())
  clock.tick(STORE_UNMOUNT_DELAY * 2)
  off = $personAndSearchMessages.listen(noop)
  await finishMicrotask()
  equal(cbCount, 6)
  equal(fetchCount, 4)
  off()
  equal(cbCount, 6)
  equal(fetchCount, 4)

  $search.set('a-match')
  equal(cbCount, 7)
  equal(fetchCount, 5)
  equal($personAndSearchMessages.get(), person1LoadingAMatch())
  await finishMicrotask()
  equal($personAndSearchMessages.get(), person1LoadingAMatch())
  $search.set('no-match')
  equal(cbCount, 8)
  equal(fetchCount, 6)
  equal($personAndSearchMessages.get(), person1LoadingNoMatch())
  await finishMicrotask()
  equal($personAndSearchMessages.get(), person1LoadingNoMatch())

  $search.set('a-match')
  equal(cbCount, 9)
  equal(fetchCount, 7)
  equal($personAndSearchMessages.get(), person1LoadingAMatch())
  await finishMicrotask()
  equal($personAndSearchMessages.get(), person1LoadingAMatch())
  $deactivate.set(true)
  equal(cbCount, 10)
  equal(fetchCount, 7)
  equal($personAndSearchMessages.get(), person1LoadingAMatch())

  $deactivate.set(false)
  equal(cbCount, 11)
  equal(fetchCount, 8)
  equal($personAndSearchMessages.get(), person1LoadingAMatch())
  await finishMicrotask()
  equal($personAndSearchMessages.get(), person1LoadingAMatch())
  await finishMicrotask()
  equal(cbCount, 11)
  equal(fetchCount, 8)
  equal($personAndSearchMessages.get(), {
    person: { loading: false, name: 'John Doe', personId: 1 },
    personId: 1,
    search: 'a-match',
    searchMessages: [{
      loading: false,
      recipientId: 2,
      senderId: 1,
      text: 'Hello there a-match!'
    }]
  })

  async function fetch(url:string): Promise<Response> {
    fetchCount++
    switch (true) {
      case url === 'https://www.example.com/people/1':
        return new Response(JSON.stringify({
          loading: false,
          name: 'John Doe',
          personId: 1
        } as Person), {
          headers: {
            'Content-Type': 'application/json'
          },
          status: 200
        })
      case url === 'https://www.example.com/people/1/messages/a-match':
        return new Response(JSON.stringify([{
          loading: false,
          recipientId: 2,
          senderId: 1,
          text: 'Hello there a-match!'
        } as SearchMessage
        ]), {
          headers: {
            'Content-Type': 'application/json'
          },
          status: 200
        })
      default:
        return new Response(JSON.stringify({
          error: 'Not Found'
        }), {
          headers: {
            'Content-Type': 'application/json'
          },
          status: 404
        })
    }
  }
  function loadingPerson(personId: number):{
    person: Loading
    personId: number
  } {
    return {
      person: {
        loading: true,
        message: `loading person ${personId}`
      },
      personId
    }
  }
  function person1NullSearch():{
    person: Person
    personId: number
    search: null
    searchMessages: null
  } {
    return {
      person: { loading: false, name: 'John Doe', personId: 1 },
      personId: 1,
      search: null,
      searchMessages: null
    }
  }
  function person1LoadingAMatch():{
    person: Person
    personId: number
    search: string
    searchMessages: Loading
  } {
    return {
      person: { loading: false, name: 'John Doe', personId: 1 },
      personId: 1,
      search: 'a-match',
      searchMessages: { loading: true, message: 'loading messages a-match' },
    }
  }
  function person1LoadingNoMatch():{
    person: Person
    personId: number
    search: string
    searchMessages: Loading
  } {
    return {
      person: { loading: false, name: 'John Doe', personId: 1 },
      personId: 1,
      search: 'no-match',
      searchMessages: { loading: true, message: 'loading messages no-match' },
    }
  }
})

test('will unbind to private stores defined inside of cb', async () => {
  let $active = atom(true)
  let $base = atom(0)
  let calls:[string, number][] = []
  let $p2p2p1p2 = computed([$active], active => {
    if (!active) return null
    let $p1 = computed([$base], base => {
      let p1 = base + 1
      calls.push(['$p1', p1])
      return p1
    })
    let $p2 = computed([$p1], p1 => {
      let p2 = p1 + 1
      calls.push(['$p2', p2])
      return p2
    })
    let $p2p1p2 = computed([$p2], p2 => {
      let $p1p2 = computed([$p1, $p2], (p1, _p2) => {
        let p1p2 = p1 + _p2
        calls.push(['$p1p2', p1p2])
        return p1p2
      })
      let p2p1p2 = p2 + $p1p2()
      calls.push(['$p2p1p2', p2p1p2])
      return p2p1p2
    })
    let total = $p2() + $p2p1p2()
    calls.push(['$p2p2p1p2', total])
    return total
  })

  let noop:() => void = () => {}
  let off = $p2p2p1p2.listen(noop)

  equal($p2p2p1p2(), 7)
  equal(calls, [['$p1', 1], ['$p2', 2], ['$p1p2', 3], ['$p2p1p2', 5], ['$p2p2p1p2', 7]])

  clock.runAll()

  $base.set(1)
  equal($p2p2p1p2(), 11)
  equal(calls, [
    ['$p1', 1], ['$p2', 2], ['$p1p2', 3], ['$p2p1p2', 5], ['$p2p2p1p2', 7],
    ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p1p2', 5], ['$p2p1p2', 8], ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p2p1p2', 8], ['$p2p2p1p2', 11],
  ])

  clock.runAll()

  $base.set(2)
  equal($p2p2p1p2(), 15)
  equal(calls, [
    ['$p1', 1], ['$p2', 2], ['$p1p2', 3], ['$p2p1p2', 5], ['$p2p2p1p2', 7],
    ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p1p2', 5], ['$p2p1p2', 8], ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p2p1p2', 8], ['$p2p2p1p2', 11],
    ['$p1', 3], ['$p2', 4], ['$p1p2', 7], ['$p1p2', 7], ['$p2p1p2', 11], ['$p1', 3], ['$p2', 4], ['$p1p2', 7], ['$p2p1p2', 11], ['$p2p2p1p2', 15],
  ])


  clock.runAll()

  $base.set(3)
  equal($p2p2p1p2(), 19)
  equal(calls, [
    ['$p1', 1], ['$p2', 2], ['$p1p2', 3], ['$p2p1p2', 5], ['$p2p2p1p2', 7],
    ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p1p2', 5], ['$p2p1p2', 8], ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p2p1p2', 8], ['$p2p2p1p2', 11],
    ['$p1', 3], ['$p2', 4], ['$p1p2', 7], ['$p1p2', 7], ['$p2p1p2', 11], ['$p1', 3], ['$p2', 4], ['$p1p2', 7], ['$p2p1p2', 11], ['$p2p2p1p2', 15],
    ['$p1', 4], ['$p2', 5], ['$p1p2', 9], ['$p1p2', 9], ['$p2p1p2', 14], ['$p1', 4], ['$p2', 5], ['$p1p2', 9], ['$p2p1p2', 14], ['$p2p2p1p2', 19],
  ])

  clock.runAll()

  off()
  clock.runAll()

  off = $p2p2p1p2.listen(noop)
  off()
  clock.runAll()

  off = $p2p2p1p2.listen(noop)
  off()
  clock.runAll()
})

test.run()
