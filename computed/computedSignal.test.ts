import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers'
import { test } from 'uvu'
import { equal, ok } from 'uvu/assert'

import {
  atom,
  type Autosubscribe,
  computed,
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
  let combine = computed(use => {
    renders += 1
    return `${use($letter).letter} ${$number().number}`
  })
  equal(renders, 0)

  let value: StoreValue<typeof combine> = ''
  let unbind = combine.subscribe(combineValue => {
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
  let $decimal = computed(() => {
    return $number() * 10
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

test('prevents diamond dependency problem 1', () => {
  let $store = atom<number>(0)
  let values: string[] = []

  let $a = computed(() => `a${$store()}`)
  let $b = computed(use => use($a).replace('a', 'b'))
  let $c = computed(() => $a().replace('a', 'c'))
  let $d = computed(use => $a(use).replace('a', 'd'))

  let $combined = computed(() => `${$b()}${$c()}${$d()}`)

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

  let $a = computed(use => `a${$store(use)}`)
  let $b = computed(() => $a().replace('a', 'b'))
  let $c = computed(use => use($b).replace('b', 'c'))
  let $d = computed(() => $c().replace('c', 'd'))
  let $e = computed(use => $d(use).replace('d', 'e'))

  let $combined = computed(() => [$a(), $e()].join(''))

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

  let $a = computed(() => `a${$store()}`)
  let $b = computed(use =>
    $a(use).replace('a', 'b'))
  let $c = computed(use =>
    use($b).replace('b', 'c'))
  let $d = computed<string, Autosubscribe<string>>(use =>
    use($c).replace('c', 'd'))

  let $combined = computed(
    () =>
      `${$a()}${$b()}${$c()}${$d()}`
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
    (name: string, ...v: (number | string)[]):string =>
      `${name}${v.join('')}`

  let $a = computed(() => fn('a', $store1()))
  let $b = computed(use => fn('b', use($store2)))

  let $c = computed(() => fn('c', $a(), $b()))
  let $d = computed(use => fn('d', $a(use)))

  let $e = computed(() => fn('e', $c(), $d()))

  let $f = computed(use => fn('f', use($e)))
  let $g = computed(() => fn('g', $f()))

  let $combined1 = computed(use => $e(use))
  let $combined2 = computed(() => [$e(), $g()].join(''))

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
  let $fullName = computed(use => {
    let val = `${$firstName()} ${use($lastName)}`
    events += 'full '
    return val
  })
  let $isFirstShort = computed(use => {
    let val = $firstName(use).length < 10
    events += 'short '
    return val
  })
  let $displayName = computed(
    () => {
      let val = $isFirstShort() ? $fullName() : $firstName()
      events += 'display '
      return val
    }
  )

  equal(events, '')

  $displayName.listen(() => {})
  equal($displayName.get(), 'John Doe')
  equal($displayName(), 'John Doe')
  equal(events, 'short full display ')

  $firstName.set('Benedict')
  equal($displayName.get(), 'Benedict Doe')
  equal($displayName(), 'Benedict Doe')
  equal(events, 'short full display short full display ')

  $firstName.set('Montgomery')
  equal($displayName.get(), 'Montgomery')
  equal($displayName(), 'Montgomery')
  equal(events, 'short full display short full display short full display ')
})

test('prevents diamond dependency problem 6', () => {
  let $store1 = atom<number>(0)
  let $store2 = atom<number>(0)
  let values: string[] = []

  let $a = computed(use => `a${use($store1)}`)
  let $b = computed(() => `b${$store2()}`)
  let $c = computed(() => $b().replace('b', 'c'))

  let $combined = computed(() => `${$a()}${$c()}`)

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
  let $a = computed(() => {
    return `${$base()}a`
  })
  let $b = computed(use => {
    return `${$a(use)}b`
  })

  equal($b.get(), '0ab')
  equal($b(), '0ab')
  let values: string[] = []
  let unsubscribe = $b.subscribe(b => values.push(b))
  equal(values, ['0ab'])

  clock.tick(STORE_UNMOUNT_DELAY * 2)
  equal($a.get(), '0a')
  equal($a(), '0a')
  $base.set(1)
  equal(values, ['0ab', '1ab'])

  unsubscribe()
})

test('notifies when stores change within the same notifyId', () => {
  let $val = atom(1)

  let $computed1 = computed(use => {
    return use($val)
  })

  let $computed2 = computed(() => {
    return $computed1()
  })

  let events: any[] = []
  $val.subscribe(val => events.push({ val }))
  $computed2.subscribe(computed2 => {
    events.push({ computed2 })
    if (computed2 % 2 === 1) {
      $val.set($val.get() + 1)
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
  let $deferrer = computed(use => $store(use) * 2)

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
  equal($deferrer.get(), $store.get() * 2)
  equal($deferrer(), $store() * 2)
  equal(deferrerValue, $store() * 2)
  ok($store.lc > 0)
  equal(events, 'init ')

  $store.set(3)
  equal($deferrer.get(), $store.get() * 2)
  equal($deferrer(), $store() * 2)
  equal(deferrerValue, $store.get() * 2)
  equal(deferrerValue, $store() * 2)

  unbind()
  clock.runAll()
  equal($deferrer.lc, 0)
  equal(events, 'init destroy ')
})

test('computes initial value when argument is undefined', () => {
  let $one = atom<string | undefined>(undefined)
  let $two = computed(() => !!$one())
  equal($one.get(), undefined)
  equal($one(), undefined)
  equal($two.get(), false)
  equal($two(), false)
})

test('async api', async () => {
  let cbCount = 0
  let fetchCount = 0
  let $deactivate = atom(false)
  let $personId = atom<null | number>(null)
  let $personOpCount = atom(0)
  let $search = atom<null | string>(null)
  let $personAndSearchMessages = computed<
    {
      person?: Loading | null | Person
      personId: number
      search?: null | string
      searchMessages?: Loading | null | SearchMessage[],
    }|null
  >( async use => {
    cbCount++
    if ($deactivate()) return use.undo()
    if (!$personId()) return null
    let personId = $personId()!
    let search: null|string
    let cancel: () => boolean = () => $deactivate() || use.stale()
    let person: ErrorPayload | Loading | null | Person =
      use() && use()!.personId === personId && !use()!.person?.loading
      ? use()!.person!
      : null
    if (!person) {
      use.set({
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
      if ((<ErrorPayload>person)!.error || cancel()) return use.undo()
    }
    search = $search(use)
    let personAndNull = {
      person: <Person>person,
      personId,
      search,
      searchMessages: null
    }
    if (!search) return personAndNull
    let searchMessages: ErrorPayload | Loading | null | SearchMessage[] =
      use()!.search === search
      ? use()!.searchMessages ?? null
      : null
    if (!searchMessages) {
      use.save({
        person: <Person>person,
        personId,
        search,
        searchMessages: {
          loading: true,
          message: `loading messages ${search}`
        }
      })
    }
    search = use($search)
    if (!search) return null
    use.set({
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
    if (!searchMessages || (<ErrorPayload>searchMessages).error || cancel()) {
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

test('will unbind to atoms defined inside of cb', async () => {
  let onCount = 0
  let offCount = 0
  let $base = atom(0)
  let calls:[string, number][] = []
  let $p2p2p1p2 = computed(use => {
    let $p1 = computed(() => {
      let p1 = $base() + 1
      calls.push(['$p1', p1])
      return p1
    })
    let $p2 = computed(() => {
      let p2 = $p1() + 1
      calls.push(['$p2', p2])
      return p2
    })
    let $p2p1p2 = computed(() => {
      let $p1p2 = computed(() => {
        let p1p2 = $p1() + $p2()
        calls.push(['$p1p2', p1p2])
        return p1p2
      })
      let p2p1p2 = $p2() + $p1p2()
      calls.push(['$p2p1p2', p2p1p2])
      return p2p1p2
    })
    let total = $p2() + $p2p1p2()
    use
      .onStart(() => onCount++)
      .onStop(() => offCount++)
    calls.push(['$p2p2p1p2', total])
    return total
  })

  let noop:() => void = () => {}
  let off = $p2p2p1p2.listen(noop)

  equal(onCount, 1)
  equal(offCount, 0)
  equal($p2p2p1p2(), 7)
  equal(calls, [['$p1', 1], ['$p2', 2], ['$p1p2', 3], ['$p2p1p2', 5], ['$p2p2p1p2', 7]])

  equal(onCount, 1)
  equal(offCount, 0)
  clock.runAll()
  equal(onCount, 1)
  equal(offCount, 0)

  $base.set(1)
  equal(onCount, 2)
  equal(offCount, 1)
  equal($p2p2p1p2(), 11)
  equal(calls, [
    ['$p1', 1], ['$p2', 2], ['$p1p2', 3], ['$p2p1p2', 5], ['$p2p2p1p2', 7],
    ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p1p2', 5], ['$p2p1p2', 8], ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p2p1p2', 8], ['$p2p2p1p2', 11],
  ])

  equal(onCount, 2)
  equal(offCount, 1)
  clock.runAll()
  equal(onCount, 2)
  equal(offCount, 1)

  $base.set(2)
  equal(onCount, 3)
  equal(offCount, 2)
  equal($p2p2p1p2(), 15)
  equal(calls, [
    ['$p1', 1], ['$p2', 2], ['$p1p2', 3], ['$p2p1p2', 5], ['$p2p2p1p2', 7],
    ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p1p2', 5], ['$p2p1p2', 8], ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p2p1p2', 8], ['$p2p2p1p2', 11],
    ['$p1', 3], ['$p2', 4], ['$p1p2', 7], ['$p1p2', 7], ['$p2p1p2', 11], ['$p1', 3], ['$p2', 4], ['$p1p2', 7], ['$p2p1p2', 11], ['$p2p2p1p2', 15],
  ])


  equal(onCount, 3)
  equal(offCount, 2)
  clock.runAll()
  equal(onCount, 3)
  equal(offCount, 2)

  $base.set(3)
  equal(onCount, 4)
  equal(offCount, 3)
  equal($p2p2p1p2(), 19)
  equal(calls, [
    ['$p1', 1], ['$p2', 2], ['$p1p2', 3], ['$p2p1p2', 5], ['$p2p2p1p2', 7],
    ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p1p2', 5], ['$p2p1p2', 8], ['$p1', 2], ['$p2', 3], ['$p1p2', 5], ['$p2p1p2', 8], ['$p2p2p1p2', 11],
    ['$p1', 3], ['$p2', 4], ['$p1p2', 7], ['$p1p2', 7], ['$p2p1p2', 11], ['$p1', 3], ['$p2', 4], ['$p1p2', 7], ['$p2p1p2', 11], ['$p2p2p1p2', 15],
    ['$p1', 4], ['$p2', 5], ['$p1p2', 9], ['$p1p2', 9], ['$p2p1p2', 14], ['$p1', 4], ['$p2', 5], ['$p1p2', 9], ['$p2p1p2', 14], ['$p2p2p1p2', 19],
  ])

  equal(onCount, 4)
  equal(offCount, 3)
  clock.runAll()
  equal(onCount, 4)
  equal(offCount, 3)

  off()
  equal(onCount, 4)
  equal(offCount, 3)
  clock.runAll()
  equal(onCount, 4)
  equal(offCount, 4)

  off = $p2p2p1p2.listen(noop)
  equal(onCount, 5)
  equal(offCount, 4)
  off()
  clock.runAll()
  equal(onCount, 5)
  equal(offCount, 5)

  off = $p2p2p1p2.listen(noop)
  equal(onCount, 6)
  equal(offCount, 5)
  off()
  clock.runAll()
  equal(onCount, 6)
  equal(offCount, 6)
})

test.run()
