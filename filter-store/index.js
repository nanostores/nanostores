let { isFirstOlder } = require('@logux/core')
let { track } = require('@logux/client')

let { LoguxClientStore } = require('../logux-client-store')

function cleanOnNoListener (store) {
  store.addListener()()
}

class FilterStore extends LoguxClientStore {
  static filter (client, StoreClass, filter = {}, opts = {}) {
    let id = StoreClass.plural + JSON.stringify(filter) + JSON.stringify(opts)
    if (this.loaded && this.loaded.has(id)) {
      return this.loaded.get(id)
    } else {
      let store = this.load(id, client)
      store.filter(StoreClass, filter, opts)
      this.loaded.set(id, store)
      return store
    }
  }

  constructor (id, client) {
    super(id, client)
    this.stores = new Map()
    this.unbindIds = new Map()
    this.unbind = []

    this.isLoading = true
    this.storeLoading = new Promise((resolve, reject) => {
      this.filter = (StoreClass, filter = {}, opts = {}) => {
        if (opts.listChangesOnly) {
          this.listener = () => {}
        } else {
          this.listener = (store, diff) => {
            this.notifyListener(store.id, diff)
          }
        }

        if (process.env.NODE_ENV !== 'production') {
          if (StoreClass.plural === '@logux/maps') {
            throw new Error(`Set ${StoreClass.name}.plural`)
          }
        }
        let createdType = `${StoreClass.plural}/created`
        let createType = `${StoreClass.plural}/create`
        let changedType = `${StoreClass.plural}/changed`
        let changeType = `${StoreClass.plural}/change`
        let deletedType = `${StoreClass.plural}/deleted`
        let deleteType = `${StoreClass.plural}/delete`

        function checkSomeFields (fields) {
          let some = Object.keys(filter).length === 0
          for (let key in filter) {
            if (key in fields) {
              if (fields[key] === filter[key]) {
                some = true
              } else {
                return false
              }
            }
          }
          return some
        }

        function checkAllFields (fields) {
          for (let key in filter) {
            if (fields[key] !== filter[key]) {
              return false
            }
          }
          return true
        }

        if (StoreClass.loaded) {
          for (let store of StoreClass.loaded.values()) {
            if (checkAllFields(store)) this.add(store)
          }
        }

        let ignore = new Set()
        let checking = []
        if (StoreClass.offline) {
          client.log
            .each(async action => {
              if (action.id && !ignore.has(action.id)) {
                let type = action.type
                if (
                  type === createdType ||
                  type === createType ||
                  type === changedType ||
                  type === changeType
                ) {
                  if (checkSomeFields(action.fields)) {
                    let check = async () => {
                      let store = StoreClass.load(action.id, client)
                      if (store.isLoading) await store.storeLoading
                      if (checkAllFields(store)) {
                        this.add(store)
                      } else {
                        cleanOnNoListener(store)
                      }
                    }
                    checking.push(check())
                    ignore.add(action.id)
                  }
                } else if (type === deletedType || type === deleteType) {
                  ignore.add(action.id)
                }
              }
            })
            .then(async () => {
              await Promise.all(checking)
              if (!StoreClass.remote && this.isLoading) {
                this.isLoading = false
                resolve()
              }
            })
        }
        if (StoreClass.remote) {
          client
            .sync({
              type: 'logux/subscribe',
              channel: StoreClass.plural,
              filter
            })
            .then(() => {
              if (this.isLoading) {
                this.isLoading = false
                resolve()
              }
            })
            .catch(reject)
        }

        let removeAndListen = (storeId, actionId) => {
          let store = StoreClass.loaded.get(storeId)
          let clear = store.addListener(() => {})
          this.remove(storeId)
          track(client, actionId)
            .then(() => {
              clear()
            })
            .catch(() => {
              this.add(store)
            })
        }

        if (StoreClass.remote) {
          this.unbind.push(() => {
            client.log.add(
              {
                type: 'logux/unsubscribe',
                channel: StoreClass.plural,
                filter
              },
              { sync: true }
            )
          })
        }

        function setReason (action, meta) {
          if (checkAllFields(action.fields)) {
            meta.reasons.push(id)
          }
        }

        function createAt (storeId) {
          return StoreClass.loaded.get(storeId).createdActionMeta
        }

        this.unbind.push(
          client.log.type(createdType, setReason, { event: 'preadd' }),
          client.log.type(createType, setReason, { event: 'preadd' }),
          client.log.type(createdType, (action, meta) => {
            if (checkAllFields(action.fields)) {
              let store = StoreClass.load(action.id, client)
              store.processCreate(action, meta)
              this.add(store)
            }
          }),
          client.log.type(createType, (action, meta) => {
            if (checkAllFields(action.fields)) {
              let store = StoreClass.load(action.id, client)
              store.processCreate(action, meta)
              this.add(store)
              track(client, meta.id).catch(() => {
                this.remove(action.id)
              })
            }
          }),
          client.log.type(changedType, async action => {
            await Promise.resolve()
            if (this.stores.has(action.id)) {
              if (!checkAllFields(StoreClass.loaded.get(action.id))) {
                this.remove(action.id)
              }
            } else if (checkSomeFields(action.fields)) {
              let store = StoreClass.load(action.id, client)
              if (store.isLoading) await store.storeLoading
              if (checkAllFields(store)) {
                this.add(store)
              } else {
                cleanOnNoListener(store)
              }
            }
          }),
          client.log.type(changeType, async (action, meta) => {
            await Promise.resolve()
            if (this.stores.has(action.id)) {
              if (!checkAllFields(StoreClass.loaded.get(action.id))) {
                removeAndListen(action.id, meta.id)
              }
            } else if (checkSomeFields(action.fields)) {
              let store = StoreClass.load(action.id, client)
              if (store.isLoading) await store.storeLoading
              if (checkAllFields(store)) {
                this.add(store)
                track(client, meta.id).catch(async () => {
                  let unbind = store.addListener(() => {
                    if (!checkAllFields(store)) {
                      this.remove(action.id)
                    }
                    unbind()
                  })
                })
              } else {
                cleanOnNoListener(store)
              }
            }
          }),
          client.log.type(deletedType, (action, meta) => {
            if (
              this.stores.has(action.id) &&
              isFirstOlder(createAt(action.id), meta)
            ) {
              this.remove(action.id)
            }
          }),
          client.log.type(deleteType, (action, meta) => {
            if (
              this.stores.has(action.id) &&
              isFirstOlder(createAt(action.id), meta)
            ) {
              removeAndListen(action.id, meta.id)
            }
          })
        )
      }
    })
  }

  add (store) {
    if (this.stores.has(store.id)) return
    this.unbindIds.set(store.id, store.addListener(this.listener))
    this.stores.set(store.id, store)
    this.notifyListener('stores', this.stores)
  }

  remove (id) {
    if (!this.stores.has(id)) return
    this.unbindIds.get(id)()
    this.unbindIds.delete(id)
    this.stores.delete(id)
    this.notifyListener('stores', this.stores)
  }

  destroy () {
    for (let i of this.unbind) i()
    for (let i of this.unbindIds.values()) i()
    this.loguxClient.log.removeReason(this.id)
  }
}

module.exports = { FilterStore }
