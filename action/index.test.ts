import { onNotify, atom } from '../index.js'
import { action } from './index.js'

it('show action name', () => {
  let events: string[] = []
  let testingStore = atom(1)
  let unbind = onNotify<{ actionName: any }, number>(
    testingStore,
    ({ shared }) => {
      events.push(shared.actionName)
    }
  )

  let setProp = action(testingStore, 'setProp', (num: number) => {
    testingStore.set(num)
  })

  setProp(1)
  setProp(2)
  setProp(3)
  unbind()
  expect(events).toEqual(['setProp', 'setProp', 'setProp'])
})
