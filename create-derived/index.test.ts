import { delay } from 'nanodelay'

import { createStore, createDerived, StoreValue } from '../index.js'

it('converts stores values', async () => {
  let destroys = ''
  let letter = createStore<string>(() => {
    letter.set('a')
    return () => {
      destroys += 'letter '
    }
  })
  let number = createStore<number>(() => {
    number.set(0)
    return () => {
      destroys += 'number '
    }
  })

  let renders = 0
  let combine = createDerived([letter, number], (letterValue, numberValue) => {
    renders += 1
    return `${letterValue} ${numberValue}`
  })
  expect(renders).toEqual(0)

  let value: StoreValue<typeof combine> = ''
  let unbind = combine.subscribe(combineValue => {
    value = combineValue
  })
  expect(value).toEqual('a 0')
  expect(renders).toEqual(1)

  letter.set('b')
  expect(value).toEqual('b 0')
  expect(renders).toEqual(2)

  number.set(1)
  expect(value).toEqual('b 1')
  expect(renders).toEqual(3)
  expect(destroys).toEqual('')

  unbind()
  await delay(50)
  expect(value).toEqual('b 1')
  expect(renders).toEqual(3)
  expect(destroys).toEqual('letter number ')
})

it('works with single store', () => {
  let number = createStore<number>(() => {
    number.set(1)
  })
  let decimal = createDerived(number, count => {
    return count * 10
  })

  let value
  let unbind = decimal.subscribe(decimalValue => {
    value = decimalValue
  })
  expect(value).toEqual(10)

  number.set(2)
  expect(value).toEqual(20)

  unbind()
})
