import { delay } from 'nanodelay'

import { local } from '../index.js'

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

  let unbind = Test.subscribe(test => {
    events.push(`change ${test.value}`)
  })

  expect(Test.load().value).toEqual('initial')
  expect(events).toEqual(['init initial'])

  await delay(10)
  expect(events).toEqual(['init initial'])

  Test.load().change('2')
  expect(Test.load().value).toEqual('2')
  expect(events).toEqual(['init initial'])

  Test.load().change('3')
  expect(Test.load().value).toEqual('3')
  await delay(1)
  expect(events).toEqual(['init initial', 'change 3'])

  unbind()
  await delay(1)
  expect(events).toEqual(['init initial', 'change 3', 'destroy 3'])
})

it('accepts store without options', async () => {
  let Test = local('initial')
  let unbind = Test.subscribe(() => {})

  expect(Test.load().value).toEqual('initial')

  unbind()
  await delay(1)
  expect(Test.loaded).toBeUndefined()
})
