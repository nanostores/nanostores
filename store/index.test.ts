import { TestClient } from '@logux/client'

import { STORE_RESERVED_KEYS, SyncMap } from '../index.js'

class TestMap extends SyncMap {
  static plural = 'test'
}

it('keeps all reversed keys in array', () => {
  let client = new TestClient('10')
  let store = TestMap.load('ID', client)
  for (let key in store) {
    expect(STORE_RESERVED_KEYS.has(key) || key === 'id').toBe(true)
  }
})
