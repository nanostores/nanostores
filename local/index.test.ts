import { delay } from 'nanodelay'

import { local, subscribe } from '../index.js'

it('creates local store', async () => {
  let events: string[] = []
  let Test = local('initial', {
    init (store) {
      events.push(`init ${store.value}`)
    },
    destroy (store) {
      events.push(`destroy ${store.value}`)
    }
  })

  let test = Test.load()
  let unbind = test[subscribe](() => {
    events.push(`change ${test.value}`)
  })

  expect(test.value).toEqual('initial')
  expect(events).toEqual(['init initial'])

  await delay(10)
  expect(events).toEqual(['init initial'])

  test.change('2')
  expect(test.value).toEqual('2')
  expect(events).toEqual(['init initial'])

  test.change('3')
  expect(test.value).toEqual('3')
  await delay(1)
  expect(events).toEqual(['init initial', 'change 3'])

  unbind()
  await delay(1)
  expect(events).toEqual(['init initial', 'change 3', 'destroy 3'])
})

it('accepts store without options', async () => {
  let Test = local('initial')

  let test = Test.load()
  let unbind = test[subscribe](() => {})

  expect(test.value).toEqual('initial')

  unbind()
  await delay(1)
  expect(Test.loaded).toBeUndefined()
})
