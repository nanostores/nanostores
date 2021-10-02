import { jest } from '@jest/globals'

import { atom, computed, StoreValue } from '../index.js'

jest.useFakeTimers()

it('converts stores values', () => {
  let letter = atom<{ letter: string }>({ letter: 'a' })
  let number = atom<{ number: number }>({ number: 0 })

  let renders = 0
  let combine = computed([letter, number], (letterValue, numberValue) => {
    renders += 1
    return `${letterValue.letter} ${numberValue.number}`
  })
  expect(renders).toEqual(0)

  let value: StoreValue<typeof combine> = ''
  let unbind = combine.subscribe(combineValue => {
    value = combineValue
  })
  expect(value).toEqual('a 0')
  expect(renders).toEqual(1)

  letter.set({ letter: 'b' })
  expect(value).toEqual('b 0')
  expect(renders).toEqual(2)

  number.set({ number: 1 })
  expect(value).toEqual('b 1')
  expect(renders).toEqual(3)

  unbind()
  jest.runAllTimers()
  expect(value).toEqual('b 1')
  expect(renders).toEqual(3)
})

it('works with single store', () => {
  let number = atom<number>(1)
  let decimal = computed(number, count => {
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

it('prevents diamond dependency problem', () => {
  let store = atom<number>(0)
  let values: string[] = []

  let a = computed(store, count => `a${count}`)
  let b = computed(store, count => `b${count}`)
  let combined = computed([a, b], (first, second) => `${first}${second}`)

  let unsubscribe = combined.subscribe(v => {
    values.push(v)
  })

  expect(values).toEqual(['a0b0'])

  store.set(1)
  expect(values).toEqual(['a0b0', 'a1b1'])

  unsubscribe()
})
