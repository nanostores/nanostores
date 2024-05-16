import { deepStrictEqual, equal, notEqual } from 'node:assert'
import { test } from 'node:test'

import { getPath, setPath } from './path.js'

test('path evaluates correct value', () => {
  let exampleObj = {
    a: '123',
    b: { c: 123, d: [{ e: 123 }] },
    f: [
      [1, 2],
      [{ g: 3 }, 4]
    ]
  }

  equal(getPath(exampleObj, 'a'), '123')
  equal(getPath(exampleObj, 'b.c'), 123)
  deepStrictEqual(getPath(exampleObj, 'b.d[0]'), { e: 123 })
  equal(getPath(exampleObj, 'b.d[0].e'), 123)
  equal(getPath(exampleObj, 'f[0][1]'), 2)
  equal(getPath(exampleObj, 'f[1][0].g'), 3)

  // @ts-expect-error: incorrect key here
  equal(getPath(exampleObj, 'abra.cadabra.booms'), undefined)
})

test('simple path setting', () => {
  type TestObj = {
    a: {
      b?: { c: string; d: { e: string }[] }
      e: number
    }
    f: string
  }
  let initial: TestObj = { a: { e: 123 }, f: '' }

  initial = setPath(initial, 'f', 'hey')
  deepStrictEqual(initial, { a: { e: 123 }, f: 'hey' })
})

test('nested arrays path setting', () => {
  type TestObj = {
    a: {
      b: { c: number }[][][]
      d: { e: string }[][]
    }[]
  }
  let initial: TestObj = { a: [{ b: [[[{ c: 1 }]]], d: [[{ e: 'val1' }]] }] }

  initial = setPath(initial, 'a[0].b[0][0][0].c', 2)
  initial = setPath(initial, 'a[0].d[0][1]', { e: 'val2' })
  deepStrictEqual(initial, {
    a: [{ b: [[[{ c: 2 }]]], d: [[{ e: 'val1' }, { e: 'val2' }]] }]
  })
})

test('creating objects', () => {
  type TestObj = { a?: { b?: { c?: { d: string } } } }
  let initial: TestObj = {}

  initial = setPath(initial, 'a.b.c.d', 'val')
  equal(initial.a?.b?.c?.d, 'val')
})

test('creating arrays', () => {
  type TestObj = { a?: string[] }
  let initial: TestObj = {}

  initial = setPath(initial, 'a[0]', 'val')
  deepStrictEqual(initial, { a: ['val'] })
  initial = setPath(initial, 'a[3]', 'val3')
  // The expected value is a sparse array
  let expectedA = ['val']
  expectedA[3] = 'val3'
  deepStrictEqual(initial, { a: expectedA })
})

test('removes arrays', () => {
  type TestObj = { a?: string[] }
  let initial: TestObj = { a: ['a', 'b'] }

  // @ts-expect-error: incorrect key here
  initial = setPath(initial, 'a[1]', undefined)
  deepStrictEqual(initial, { a: ['a'] })

  // @ts-expect-error: incorrect key here
  initial = setPath(initial, 'a[0]', undefined)
  deepStrictEqual(initial, { a: [] })
})

test('changes object reference at this level and earlier levels when key is changed', () => {
  type Obj = { a: { b: { c: number; d: string }; e: number } }
  let b = { c: 1, d: '1' }
  let a = { b, e: 1 }

  let initial: Obj = { a }

  initial = setPath(initial, 'a.b.c', 2)
  notEqual(initial.a, a)
  notEqual(initial.a.b, b)

  initial = setPath(initial, 'a.e', 2)
  notEqual(initial.a, a)
})

test('array items mutation changes identity on the same and earlier levels', () => {
  let arr1 = { a: 1 }
  let arr2 = { a: 2 }
  let d = [arr1, arr2]
  let c = { d }

  let initial = { a: { b: { c } } }
  let newInitial = setPath(initial, 'a.b.c.d[1].a', 3)
  notEqual(newInitial, initial)
  notEqual(newInitial.a.b.c.d, d)
  equal(newInitial.a.b.c.d[0], d[0])
  notEqual(newInitial.a.b.c.d[1], arr2)
  deepStrictEqual(newInitial.a.b.c.d[1], { a: 3 })
})

test('setting path with numbers inside does not produce any unnecessary stuff inside', () => {
  let obj: any = {}

  obj = setPath(obj, '123key', 'value')
  obj = setPath(obj, 'key123', 'value')

  deepStrictEqual(obj, { '123key': 'value', 'key123': 'value' })
})
