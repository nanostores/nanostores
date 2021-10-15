import { map, updateKey } from '../index.js'

it('updates key', () => {
  let user = map({ name: '', age: 0 })
  updateKey(user, 'age', age => age + 1)
  expect(user.get()).toEqual({ name: '', age: 1 })
})
