import { nanoid } from 'nanoid/non-secure'

export function emptyInTest (Builder) {
  if (!prepareForTest.mocked) prepareForTest.mocked = new Set()
  prepareForTest.mocked.add(Builder)
}

export function prepareForTest (client, Builder, value) {
  if (!prepareForTest.mocked) prepareForTest.mocked = new Set()
  prepareForTest.mocked.add(Builder)

  let { id, ...keys } = value
  if (!id) {
    if (Builder.plural) {
      id = `${Builder.plural}:${Object.keys(Builder.cache).length + 1}`
    } else {
      id = nanoid(6)
    }
  }

  let store = Builder(id, client)
  store.listen(() => {})

  if ('isLoading' in store.value) {
    store.setKey('isLoading', false)
  }
  for (let key in keys) {
    store.setKey(key, keys[key])
  }

  return store
}
