import { allEffects, startEffect, effect } from '../index.js'

it('waits no effects', async () => {
  await allEffects()
})

it('waits for nested effects', async () => {
  let track = ''

  async function effectA(): Promise<void> {
    let end = startEffect()
    await Promise.resolve()
    effectB()
    track += 'a'
    end()
  }

  async function effectB(): Promise<void> {
    let result = await effect(async () => {
      await Promise.resolve()
      track += 'b'
      return 5
    })
    expect(result).toEqual(5)
  }

  effectA()
  await allEffects()
  expect(track).toEqual('ab')
})