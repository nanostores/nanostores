import { track, LoguxUndoError } from '@logux/client'
import { isFirstOlder } from '@logux/core'

import { defineMap } from '../define-map/index.js'
import { getValue } from '../get-value/index.js'
import { clean } from '../clean-stores/index.js'

function changeIfLast (store, fields, meta) {
  let changes = {}
  for (let key in fields) {
    if (!meta || isFirstOlder(store.lastChanged[key], meta)) {
      changes[key] = fields[key]
      if (meta) store.lastChanged[key] = meta
    }
  }
  for (let key in changes) {
    store.setKey(key, changes[key])
  }
}

function saveProcessAndClean (store, fields, meta) {
  for (let key in fields) {
    if (isFirstOlder(store.lastProcessed[key], meta)) {
      store.lastProcessed[key] = meta
    }
    store.client.log.removeReason(`${store.plural}/${store.value.id}/${key}`, {
      olderThan: store.lastProcessed[key]
    })
  }
}

export function defineSyncMap (plural, opts = {}) {
  let Builder = defineMap((store, id, client, createAction, createMeta) => {
    if (!client) {
      throw new Error('Missed Logux client')
    }

    store.plural = plural
    store.client = client
    store.offline = Builder.offline
    store.remote = Builder.remote

    store.lastChanged = {}
    store.lastProcessed = {}

    let deletedType = `${plural}/deleted`
    let deleteType = `${plural}/delete`
    let createdType = `${plural}/created`
    let createType = `${plural}/create`
    let changeType = `${plural}/change`
    let changedType = `${plural}/changed`
    let subscribe = { type: 'logux/subscribe', channel: `${plural}/${id}` }

    let loadingError
    store.setKey('isLoading', true)

    if (createAction) {
      for (let key in createAction.fields) {
        store.setKey(key, createAction.fields[key])
        store.lastChanged[key] = createMeta
      }
      store.setKey('isLoading', false)
      store.createdAt = createMeta
      if (createAction.type === createType) {
        track(client, createMeta.id)
          .then(() => {
            saveProcessAndClean(store, createAction.fields, createMeta)
          })
          .catch(() => {})
      }
      if (store.remote) {
        client.log.add({ ...subscribe, creating: true }, { sync: true })
      }
    } else {
      let loadingResolve, loadingReject
      store.loading = new Promise((resolve, reject) => {
        loadingResolve = resolve
        loadingReject = reject
      })
      if (store.remote) {
        client
          .sync(subscribe)
          .then(() => {
            if (store.value.isLoading) {
              store.setKey('isLoading', false)
              loadingResolve()
            }
          })
          .catch(e => {
            loadingError = true
            loadingReject(e)
          })
      }
      if (store.offline) {
        let found
        client.log
          .each((action, meta) => {
            let type = action.type
            if (action.id === id) {
              if (
                type === changedType ||
                type === changeType ||
                type === createdType ||
                type === createType
              ) {
                changeIfLast(store, action.fields, meta)
                found = true
              } else if (type === deletedType || type === deleteType) {
                return false
              }
            }
          })
          .then(() => {
            if (found && store.value.isLoading) {
              store.setKey('isLoading', false)
              loadingResolve()
            } else if (!found && !store.remote) {
              loadingReject(
                new LoguxUndoError({
                  type: 'logux/undo',
                  reason: 'notFound',
                  id: client.log.generateId(),
                  action: subscribe
                })
              )
            }
          })
      }
    }

    let reasonsForFields = (action, meta) => {
      for (let key in action.fields) {
        if (isFirstOlder(store.lastProcessed[key], meta)) {
          meta.reasons.push(`${plural}/${id}/${key}`)
        }
      }
    }

    let removeReasons = () => {
      for (let key in store.lastChanged) {
        client.log.removeReason(`${plural}/${id}/${key}`)
      }
    }

    let unbinds = [
      client.type(changedType, reasonsForFields, { event: 'preadd', id }),
      client.type(changeType, reasonsForFields, { event: 'preadd', id }),
      client.type(deletedType, removeReasons, { id }),
      client.type(
        deleteType,
        async (action, meta) => {
          try {
            await track(client, meta.id)
            removeReasons()
          } catch {
            client.log.changeMeta(meta.id, { reasons: [] })
          }
        },
        { id }
      ),
      client.type(
        changedType,
        (action, meta) => {
          changeIfLast(store, action.fields, meta)
          saveProcessAndClean(store, action.fields, meta)
        },
        { id }
      ),
      client.type(
        changeType,
        async (action, meta) => {
          changeIfLast(store, action.fields, meta)
          try {
            await track(client, meta.id)
            saveProcessAndClean(store, action.fields, meta)
            if (store.offline) {
              client.log.add(
                { ...action, type: changedType },
                { time: meta.time }
              )
            }
          } catch {
            client.log.changeMeta(meta.id, { reasons: [] })
            let reverting = new Set(Object.keys(action.fields))
            client.log
              .each((a, m) => {
                if (a.id === id && m.id !== meta.id) {
                  if (
                    (a.type === changeType ||
                      a.type === changedType ||
                      a.type === createType ||
                      a.type === createdType) &&
                    Object.keys(a.fields).some(i => reverting.has(i))
                  ) {
                    let revertDiff = {}
                    for (let key in a.fields) {
                      if (reverting.has(key)) {
                        delete store.lastChanged[key]
                        reverting.delete(key)
                        revertDiff[key] = a.fields[key]
                      }
                    }
                    changeIfLast(store, revertDiff, m)
                    return reverting.size === 0 ? false : undefined
                  } else if (a.type === deleteType || a.type === deletedType) {
                    return false
                  }
                }
              })
              .then(() => {
                for (let key of reverting) {
                  store.setKey(key, undefined)
                }
              })
          }
        },
        { id }
      )
    ]

    if (store.remote) {
      unbinds.push(() => {
        if (!loadingError) {
          client.log.add(
            { type: 'logux/unsubscribe', channel: subscribe.channel },
            { sync: true }
          )
        }
      })
    }

    return () => {
      for (let i of unbinds) i()
      if (!store.offline) {
        for (let key in store.lastChanged) {
          client.log.removeReason(`${plural}/${id}/${key}`)
        }
      }
    }
  })

  Builder.plural = plural
  Builder.offline = !!opts.offline
  Builder.remote = opts.remote !== false

  if (process.env.NODE_ENV !== 'production') {
    let oldClean = Builder[clean]
    Builder[clean] = () => {
      oldClean()
      if (Builder.filters) {
        for (let id in Builder.filters) {
          Builder.filters[id][clean]()
        }
        delete Builder.filters
      }
    }
  }

  return Builder
}

export function createSyncMap (client, Builder, fields) {
  let id = fields.id
  delete fields.id
  if (Builder.remote) {
    return client
      .sync({ type: `${Builder.plural}/create`, id, fields })
      .catch(() => {})
  } else {
    return client.log.add({ type: `${Builder.plural}/created`, id, fields })
  }
}

export async function buildNewSyncMap (client, Builder, fields) {
  let id = fields.id
  delete fields.id
  let actionId = client.log.generateId()

  let verb = Builder.remote ? 'create' : 'created'
  let type = `${Builder.plural}/${verb}`
  let action = { type, id, fields }
  let meta = { id: actionId, time: parseInt(actionId) }
  if (Builder.remote) meta.sync = true
  await client.log.add(action, meta)

  let store = Builder(id, client, action, meta)
  return store
}

export function changeSyncMapById (client, Builder, id, fields, value) {
  if (value) fields = { [fields]: value }
  if (Builder.remote) {
    return client.sync({
      type: `${Builder.plural}/change`,
      id,
      fields
    })
  } else {
    return client.log.add({
      type: `${Builder.plural}/changed`,
      id,
      fields
    })
  }
}

export function changeSyncMap (store, fields, value) {
  if (value) fields = { [fields]: value }
  changeIfLast(store, fields)
  return changeSyncMapById(store.client, store, getValue(store).id, fields)
}

export function deleteSyncMapById (client, Builder, id) {
  if (Builder.remote) {
    return client.sync({ type: `${Builder.plural}/delete`, id })
  } else {
    return client.log.add({ type: `${Builder.plural}/deleted`, id })
  }
}

export function deleteSyncMap (store) {
  return deleteSyncMapById(store.client, store, getValue(store).id)
}
