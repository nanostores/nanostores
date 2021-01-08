import { delay } from 'nanodelay'

import { local, derived } from '../index.js'

it('creates derived store', async () => {
  let A = local('0')
  let B = local('0')
  let Combine = derived([A, B], (a, b) => `${a.value} ${b.value}`)

  let unbind = Combine.subscribe(() => {})
  expect(Combine.load().value).toEqual('0 0')

  A.load().change('1')
  await delay(1)
  expect(Combine.load().value).toEqual('1 0')

  B.load().change('1')
  await delay(1)
  expect(Combine.load().value).toEqual('1 1')

  unbind()
  await delay(1)
  expect(Combine.loaded).toBeUndefined()
})

it('works with single input', async () => {
  let A = local('0')
  let Combine = derived(A, a => a.value)

  let unbind = Combine.subscribe(() => {})
  expect(Combine.load().value).toEqual('0')

  A.load().change('1')
  await delay(1)
  expect(Combine.load().value).toEqual('1')

  unbind()
  await delay(1)
  expect(Combine.loaded).toBeUndefined()
})
