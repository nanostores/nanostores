import { delay } from 'nanodelay'

import { RemoteStore, LocalStore, connect, loading } from '../index.js'

it('connects stores', async () => {
  let events: string[] = []
  class Remote extends RemoteStore {
    [loading] = Promise.resolve()
    value = '1'
  }
  class Local extends LocalStore {
    value = '1'
  }
  class Combine extends LocalStore {
    value: string = ''

    constructor () {
      super()
      connect(this, [Local.load(), Remote.load('ID')], (local, remote) => {
        events.push(`update ${local.value} ${remote.value}`)
        return {
          value: `${local.value} ${remote.value}`
        }
      })
    }

    destroy () {
      events.push(`destroy ${this.value}`)
    }
  }

  let combine = Combine.load()
  combine.subscribe(() => {
    events.push(`change ${combine.value}`)
  })

  expect(combine.value).toEqual('1 1')
  expect(events).toEqual(['update 1 1'])

  await delay(10)
  expect(events).toEqual(['update 1 1'])

  Local.load().changeKey('value', '2')
  expect(combine.value).toEqual('1 1')
  await delay(20)
  expect(combine.value).toEqual('2 1')
  expect(events).toEqual(['update 1 1', 'update 2 1', 'change 2 1'])

  Remote.load('ID').changeKey('value', '3')
  Local.load().changeKey('value', '3')
  await delay(20)
  expect(combine.value).toEqual('3 3')
  expect(events).toEqual([
    'update 1 1',
    'update 2 1',
    'change 2 1',
    'update 3 3',
    'update 3 3',
    'change 3 3'
  ])

  let unbind = Local.load().subscribe(() => {})
  combine.destroy()
  await delay(1)
  expect(Remote.loaded?.size).toEqual(0)

  Local.load().changeKey('value', '4')
  expect(combine.value).toEqual('3 3')
  expect(events).toEqual([
    'update 1 1',
    'update 2 1',
    'change 2 1',
    'update 3 3',
    'update 3 3',
    'change 3 3',
    'destroy 3 3'
  ])
  unbind()
  await delay(1)
  expect(Local.loaded).toBeUndefined()
})

it('works with single store', async () => {
  class Local extends LocalStore {
    value = '1'
  }
  class Combine extends LocalStore {
    value: string = ''
    constructor () {
      super()
      connect(this, Local.load(), local => ({ value: local.value }))
    }
  }

  let combine = Combine.load()
  expect(combine.value).toEqual('1')

  Local.load().changeKey('value', '2')
  await delay(1)
  expect(combine.value).toEqual('2')
})
