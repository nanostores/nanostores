import { atom, map, updateKey, update } from '../index.js'

it('updates store', () => {
  let count = atom(0)
  update(count, value => value + 1)
  update(count, value => value + 10)
  expect(count.get()).toBe(11)
})

it('updates key', () => {
  let user = map({ name: '', age: 0 })
  updateKey(user, 'age', age => age + 1)
  expect(user.get()).toEqual({ name: '', age: 1 })
})
