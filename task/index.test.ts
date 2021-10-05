import { allTasks, startTask, task } from '../index.js'

it('waits no tasks', async () => {
  await allTasks()
})

it('waits for nested tasks', async () => {
  let track = ''

  async function taskA(): Promise<void> {
    let end = startTask()
    await Promise.resolve()
    taskB()
    track += 'a'
    end()
  }

  async function taskB(): Promise<void> {
    let result = await task(async () => {
      await Promise.resolve()
      track += 'b'
      return 5
    })
    expect(result).toEqual(5)
  }

  taskA()
  await allTasks()
  expect(track).toEqual('ab')
})

it('ends task on error', async () => {
  let error = Error('test')
  let cathed: Error | undefined
  try {
    await task(async () => {
      await Promise.resolve()
      throw error
    })
  } catch (e) {
    if (e instanceof Error) cathed = e
  }
  expect(cathed).toBe(error)
  await allTasks()
})
