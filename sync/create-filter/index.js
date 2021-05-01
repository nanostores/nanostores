import { isFirstOlder } from '@logux/core'
import { track } from '@logux/client'

import { prepareForTest } from '../../prepare-for-test/index.js'
import { createMap } from '../../create-map/index.js'

export function createFilter(client, Builder, filter = {}, opts = {}) {
  let id = Builder.plural + JSON.stringify(filter) + JSON.stringify(opts)
  if (!Builder.filters) Builder.filters = {}

  if (!Builder.filters[id]) {
    let filterStore = createMap(() => {
      let listener
      if (opts.listChangesOnly) {
        listener = () => {}
      } else {
        listener = (childValue, key) => {
          filterStore.notify(`${childValue.id}.${key}`)
        }
      }

      let stores = new Map()
      filterStore.setKey('stores', stores)
      let isLoading = true
      filterStore.setKey('isLoading', true)
      filterStore.setKey('isEmpty', true)

      let list = []
      filterStore.setKey('list', list)

      let channelPrefix = Builder.plural + '/'

      let createdType = `${Builder.plural}/created`
      let createType = `${Builder.plural}/create`
      let changedType = `${Builder.plural}/changed`
      let changeType = `${Builder.plural}/change`
      let deletedType = `${Builder.plural}/deleted`
      let deleteType = `${Builder.plural}/delete`

      let unbinds = []
      let unbindIds = new Map()
      let subscribed = new Set()

      async function add(child) {
        let unbindChild = child.listen(listener)
        if (stores.has(child.value.id)) {
          unbindChild()
          return
        }
        unbindIds.set(child.value.id, unbindChild)
        stores.set(child.value.id, child)
        filterStore.notify('stores')
        filterStore.setKey(
          'list',
          Array.from(stores.values()).map(i => i.value)
        )
        filterStore.setKey('isEmpty', stores.size === 0)
      }

      function remove(childId) {
        subscribed.delete(channelPrefix + childId)
        if (stores.has(childId)) {
          unbindIds.get(childId)()
          unbindIds.delete(childId)
          stores.delete(childId)
          filterStore.notify('stores')
          filterStore.setKey(
            'list',
            Array.from(stores.values()).map(i => i.value)
          )
          filterStore.setKey('isEmpty', stores.size === 0)
        }
      }

      function checkSomeFields(fields) {
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

      function checkAllFields(fields) {
        for (let key in filter) {
          if (fields[key] !== filter[key]) {
            return false
          }
        }
        return true
      }

      let subscriptionError

      filterStore.loading = new Promise((resolve, reject) => {
        async function loadAndCheck(child) {
          let clear = child.listen(() => {})
          if (child.value.isLoading) await child.loading
          if (checkAllFields(child.value)) {
            add(child)
          }
          clear()
        }

        for (let i in Builder.cache) {
          loadAndCheck(Builder.cache[i])
        }

        let load = true
        if (process.env.NODE_ENV !== 'production') {
          if (prepareForTest.mocked && prepareForTest.mocked.has(Builder)) {
            load = false
            filterStore.setKey('isLoading', false)
            resolve()
          }
        }

        if (load) {
          let ignore = new Set()
          let checking = []
          if (Builder.offline) {
            client.log
              .each({ index: Builder.plural }, async action => {
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
                        loadAndCheck(Builder(action.id, client))
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
                if (!Builder.remote && isLoading) {
                  isLoading = false
                  filterStore.setKey('isLoading', false)
                  resolve()
                }
              })
          }

          if (Builder.remote) {
            client
              .sync({
                type: 'logux/subscribe',
                channel: Builder.plural,
                filter
              })
              .then(() => {
                if (isLoading) {
                  isLoading = false
                  filterStore.setKey('isLoading', false)
                  resolve()
                }
              })
              .catch(e => {
                subscriptionError = true
                reject(e)
              })
          }
        }

        function setReason(action, meta) {
          if (checkAllFields(action.fields)) {
            meta.reasons.push(id)
          }
        }

        function createAt(childId) {
          return Builder.cache[childId].createdAt
        }

        let removeAndListen = (childId, actionId) => {
          let child = Builder(childId, client)
          let clear = child.listen(() => {})
          remove(childId)
          track(client, actionId)
            .catch(() => {
              add(child)
            })
            .finally(() => {
              clear()
            })
        }

        unbinds.push(
          client.type('logux/subscribed', action => {
            if (action.channel.startsWith(channelPrefix)) {
              subscribed.add(action.channel)
            }
          }),
          client.type(createdType, setReason, { event: 'preadd' }),
          client.type(createType, setReason, { event: 'preadd' }),
          client.type(createdType, async (action, meta) => {
            if (checkAllFields(action.fields)) {
              add(
                Builder(
                  action.id,
                  client,
                  action,
                  meta,
                  subscribed.has(channelPrefix + action.id)
                )
              )
            }
          }),
          client.type(createType, async (action, meta) => {
            if (checkAllFields(action.fields)) {
              let child = Builder(action.id, client, action, meta)
              try {
                add(child)
                track(client, meta.id).catch(() => {
                  remove(action.id)
                })
              } catch {}
            }
          }),
          client.type(changedType, async action => {
            await Promise.resolve()
            if (stores.has(action.id)) {
              if (!checkAllFields(stores.get(action.id).value)) {
                remove(action.id)
              }
            } else if (checkSomeFields(action.fields)) {
              loadAndCheck(Builder(action.id, client))
            }
          }),
          client.type(changeType, async (action, meta) => {
            await Promise.resolve()
            if (stores.has(action.id)) {
              if (!checkAllFields(stores.get(action.id).value)) {
                removeAndListen(action.id, meta.id)
              }
            } else if (checkSomeFields(action.fields)) {
              let child = Builder(action.id, client)
              let clear = child.listen(() => {})
              if (child.value.isLoading) await child.loading
              if (checkAllFields(child.value)) {
                clear()
                add(child)
                track(client, meta.id).catch(async () => {
                  let unbind = child.listen(() => {
                    if (!checkAllFields(child.value)) {
                      remove(action.id)
                    }
                    unbind()
                  })
                })
              }
            }
          }),
          client.type(deletedType, (action, meta) => {
            if (
              stores.has(action.id) &&
              isFirstOlder(createAt(action.id), meta)
            ) {
              remove(action.id)
            }
          }),
          client.type(deleteType, (action, meta) => {
            if (
              stores.has(action.id) &&
              isFirstOlder(createAt(action.id), meta)
            ) {
              removeAndListen(action.id, meta.id)
            }
          })
        )
      })

      return () => {
        for (let unbind of unbinds) unbind()
        for (let unbindChild of unbindIds.values()) unbindChild()
        if (Builder.remote) {
          if (!subscriptionError) {
            client.log.add(
              {
                type: 'logux/unsubscribe',
                channel: Builder.plural,
                filter
              },
              { sync: true }
            )
          }
        }
        client.log.removeReason(id)
        delete Builder.filters[id]
      }
    })
    Builder.filters[id] = filterStore
  }
  return Builder.filters[id]
}
