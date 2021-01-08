import { delay } from 'nanodelay'

import { local, derived, subscribe } from '../index.js'

it('creates derived store', async () => {
  let A = local('0')
  let B = local('0')
  let Combine = derived([A, B], (a, b) => `${a.value} ${b.value}`)

  let combine = Combine.load()
  let unbind = combine[subscribe](() => {})
  expect(combine.value).toEqual('0 0')

  A.load().change('1')
  await delay(1)
  expect(combine.value).toEqual('1 0')

  B.load().change('1')
  await delay(1)
  expect(combine.value).toEqual('1 1')

  unbind()
  await delay(1)
  expect(Combine.loaded).toBeUndefined()
})

it('works with single input', async () => {
  let A = local('0')
  let Combine = derived(A, a => a.value)

  let combine = Combine.load()
  expect(combine.value).toEqual('0')

  A.load().change('1')
  await delay(1)
  expect(combine.value).toEqual('1')
})
