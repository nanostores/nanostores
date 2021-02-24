import { isFirstOlder } from '@logux/core'
import { track } from '@logux/client'

import { createMap } from '../create-map/index.js'

function findIndex (array, sortValue, id) {
  let start = 0
  let end = array.length - 1
  let middle = Math.floor((start + end) / 2)
  while (start <= end) {
    if (sortValue > array[middle][0]) {
      start = middle + 1
    } else if (sortValue < array[middle][0]) {
      end = middle - 1
    } else if (id === array[middle][1]) {
      return middle
    } else if (id > array[middle][1]) {
      start = middle + 1
    } else {
      end = middle - 1
    }
    middle = Math.floor((start + end) / 2)
  }
  return middle + 1
}

export function createFilter (client, Builder, filter = {}, opts = {}) {
  let sortBy
  if (opts.sortBy) {
    if (typeof opts.sortBy === 'string') {
      sortBy = value => value[opts.sortBy]
    } else {
      sortBy = opts.sortBy
    }
  }

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

      let sortValues, sortIndex
      let list = []
      filterStore.setKey('list', list)
      if (sortBy) {
        sortValues = new Map()
        sortIndex = []
        let oldListener = listener
        listener = (childValue, key) => {
          let sortValue = sortBy(childValue)
          let prevSortValue = sortValues.get(childValue.id)
          if (sortValue !== prevSortValue) {
            sortValues.set(childValue.id, sortValue)
            let prevIndex = findIndex(sortIndex, prevSortValue, childValue.id)
            sortIndex.splice(prevIndex, 1)
            list.splice(prevIndex, 1)
            let nextIndex = findIndex(sortIndex, sortValue, childValue.id)
            sortIndex.splice(nextIndex, 0, [sortValue, childValue.id])
            list.splice(nextIndex, 0, childValue)
            if (prevIndex !== nextIndex) {
              filterStore.notify('list', list)
            }
          }
          oldListener(childValue, key)
        }
      }

      let createdType = `${Builder.plural}/created`
      let createType = `${Builder.plural}/create`
      let changedType = `${Builder.plural}/changed`
      let changeType = `${Builder.plural}/change`
      let deletedType = `${Builder.plural}/deleted`
      let deleteType = `${Builder.plural}/delete`

      let unbinds = []
      let unbindIds = new Map()

      async function add (child) {
        let unbindChild = child.listen(listener)
        if (stores.has(child.value.id)) {
          unbindChild()
          return
        }
        unbindIds.set(child.value.id, unbindChild)
        stores.set(child.value.id, child)
        filterStore.notify('stores')
        if (sortBy) {
          let sortValue = sortBy(child.value)
          sortValues.set(child.value.id, sortValue)
          let index = findIndex(sortIndex, sortValue, child.value.id)
          list.splice(index, 0, child.value)
          sortIndex.splice(index, 0, [sortValue, child.value.id])
          filterStore.notify('list', list)
        } else {
          filterStore.setKey(
            'list',
            Array.from(stores.values()).map(i => i.value)
          )
        }
        filterStore.setKey('isEmpty', stores.size === 0)
      }

      function remove (childId) {
        if (stores.has(childId)) {
          unbindIds.get(childId)()
          unbindIds.delete(childId)
          stores.delete(childId)
          filterStore.notify('stores')
          if (sortBy) {
            let sortValue = sortValues.get(childId)
            sortValues.delete(childId)
            let index = findIndex(sortIndex, sortValue, childId)
            sortIndex.splice(index, 1)
            list.splice(index, 1)
            filterStore.notify('list')
          } else {
            filterStore.setKey(
              'list',
              Array.from(stores.values()).map(i => i.value)
            )
          }
          filterStore.setKey('isEmpty', stores.size === 0)
        }
      }

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

      let subscriptionError

      filterStore.loading = new Promise((resolve, reject) => {
        async function loadAndCheck (child) {
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

        let ignore = new Set()
        let checking = []
        if (Builder.offline) {
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

        function setReason (action, meta) {
          if (checkAllFields(action.fields)) {
            meta.reasons.push(id)
          }
        }

        function createAt (childId) {
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
          client.log.type(createdType, setReason, { event: 'preadd' }),
          client.log.type(createType, setReason, { event: 'preadd' }),
          client.log.type(createdType, async (action, meta) => {
            if (checkAllFields(action.fields)) {
              add(Builder(action.id, client, action, meta))
            }
          }),
          client.log.type(createType, async (action, meta) => {
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
          client.log.type(changedType, async action => {
            await Promise.resolve()
            if (stores.has(action.id)) {
              if (!checkAllFields(stores.get(action.id).value)) {
                remove(action.id)
              }
            } else if (checkSomeFields(action.fields)) {
              loadAndCheck(Builder(action.id, client))
            }
          }),
          client.log.type(changeType, async (action, meta) => {
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
          client.log.type(deletedType, (action, meta) => {
            if (
              stores.has(action.id) &&
              isFirstOlder(createAt(action.id), meta)
            ) {
              remove(action.id)
            }
          }),
          client.log.type(deleteType, (action, meta) => {
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
