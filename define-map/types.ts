import { BuilderStore, defineMap } from '../index.js'

interface UserValue {
  name: string
}

interface UserExt {
  cache?: string
}

let User = defineMap<UserValue, [], UserExt>(store => {
  store.setKey('name', 'anonymous')
})

function renameUser(user: BuilderStore<typeof User>, newName: string): void {
  user.setKey('name', newName)
  user.cache = undefined
}

renameUser(User('1'), 'New name')
