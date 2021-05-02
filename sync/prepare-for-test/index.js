let lastId = 0

export function emptyInTest(Builder) {
  if (!Builder.mocks) Builder.mocked = true
}

export function prepareForTest(client, Builder, value) {
  if (!Builder.mocks) Builder.mocked = true

  let { id, ...keys } = value
  if (!id) {
    if (Builder.plural) {
      id = `${Builder.plural}:${Object.keys(Builder.cache).length + 1}`
    } else {
      id = `${lastId++}`
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
