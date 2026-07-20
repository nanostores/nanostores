import { equal, throws } from 'node:assert'
import { test } from 'node:test'

import { allTasks, cleanTasks, startTask, task } from '../index.js'

test('waits no tasks', async () => {
  await allTasks()
})

test('waits for nested tasks', async () => {
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
    equal(result, 5)
  }

  taskA()
  await allTasks()
  equal(track, 'ab')
})

test('ends task on error', async () => {
  let error = Error('test(')
  let catched: Error | undefined
  try {
    await task(async () => {
      await Promise.resolve()
      throw error
    })
  } catch (e) {
    if (e instanceof Error) catched = e
  }
  equal(catched, error)
  await allTasks()
})

test('returns synchronous task value', async () => {
  try {
    equal(await task(() => 5), 5)
  } finally {
    cleanTasks()
  }
})

test('ends task on synchronous error', async () => {
  let error = Error('test')
  try {
    throws(() => {
      task(() => {
        throw error
      })
    }, error)

    let ended = false
    allTasks().then(() => {
      ended = true
    })
    await Promise.resolve()
    equal(ended, true)
  } finally {
    cleanTasks()
  }
})
