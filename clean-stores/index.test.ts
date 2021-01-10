import {
  cleanStores,
  RemoteStore,
  LocalStore,
  destroy,
  loaded,
  loading
} from '../index.js'

it('cleans stores', () => {
  let events: string[] = []
  class LoadedLocal extends LocalStore {
    [destroy] () {
      events.push('LoadedLocal')
    }
  }
  LoadedLocal.load()
  class NoDestroyLocal extends LocalStore {}
  NoDestroyLocal.load()
  class NoLoadedLocal extends LocalStore {
    [destroy] () {
      events.push('NoLoadedLocal')
    }
  }
  class Remote extends RemoteStore {
    [loaded] = true;
    [loading] = Promise.resolve();
    [destroy] () {
      events.push(`Remote ${this.id}`)
    }
  }
  class NoDestroyRemote extends RemoteStore {
    [loaded] = true;
    [loading] = Promise.resolve()
  }
  Remote.load('1')
  Remote.load('2')

  cleanStores(
    LoadedLocal,
    NoDestroyLocal,
    NoLoadedLocal,
    Remote,
    NoDestroyRemote
  )

  expect(events).toEqual(['LoadedLocal', 'Remote 1', 'Remote 2'])
  expect(LoadedLocal.loaded).toBeUndefined()
  expect(NoLoadedLocal.loaded).toBeUndefined()
  expect(Remote.loaded).toBeUndefined()
})
