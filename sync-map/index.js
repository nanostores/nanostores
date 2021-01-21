let { track, LoguxUndoError } = require('@logux/client')
let { isFirstOlder } = require('@logux/core')

let { ClientLogStore, loguxClient } = require('../client-log-store')
let { loading, loaded } = require('../remote-store')
let { destroy, change } = require('../store')

let lastProcessed, lastChanged, offline, unbind, createdAt

if (process.env.NODE_ENV === 'production') {
  lastProcessed = Symbol()
  lastChanged = Symbol()
  createdAt = Symbol()
  unbind = Symbol()
} else {
  lastProcessed = Symbol('lastProcessed')
  lastChanged = Symbol('lastChanged')
  createdAt = Symbol('createdAt')
  unbind = Symbol('unbind')
}

function changeIfLast (store, fields, meta) {
  let changes = {}
  for (let key in fields) {
    if (!meta || isFirstOlder(store[lastChanged][key], meta)) {
      changes[key] = fields[key]
      if (meta) store[lastChanged][key] = meta
    }
  }
  for (let key in changes) {
    store[change](key, changes[key])
  }
}

function getReason (store, key) {
  return `${store.constructor.plural}/${store.id}/${key}`
}

function saveProcessAndClean (store, fields, meta) {
  for (let key in fields) {
    if (isFirstOlder(store[lastProcessed][key], meta)) {
      store[lastProcessed][key] = meta
    }
    store[loguxClient].log.removeReason(getReason(store, key), {
      olderThan: store[lastProcessed][key]
    })
  }
}

class SyncMap extends ClientLogStore {
  constructor (id, client) {
    super(id, client)

    let deletedType = `${this.constructor.plural}/deleted`
    let deleteType = `${this.constructor.plural}/delete`
    let createdType = `${this.constructor.plural}/created`
    let createType = `${this.constructor.plural}/create`
    let changeType = `${this.constructor.plural}/change`
    let changedType = `${this.constructor.plural}/changed`

    let loadingResolve, loadingReject
    this[loaded] = false
    this[loading] = new Promise((resolve, reject) => {
      loadingResolve = resolve
      loadingReject = reject
    })
    let subscribe = {
      type: 'logux/subscribe',
      channel: `${this.constructor.plural}/${this.id}`
    }
    if (this.constructor.remote) {
      client
        .sync(subscribe)
        .then(() => {
          if (!this[loaded]) {
            this[loaded] = true
            loadingResolve()
          }
        })
        .catch(loadingReject)
    }
    Promise.resolve().then(() => {
      if (this.constructor.offline) {
        let found
        client.log
          .each((action, meta) => {
            let type = action.type
            if (action.id === this.id) {
              if (
                type === changedType ||
                type === changeType ||
                type === createdType ||
                type === createType
              ) {
                changeIfLast(this, action.fields, meta)
                found = true
              } else if (type === deletedType || type === deleteType) {
                return false
              }
            }
          })
          .then(() => {
            if (found && !this[loaded]) {
              this[loaded] = true
              loadingResolve()
            } else if (!found && !this.constructor.remote) {
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
    })

    this[lastChanged] = {}
    this[lastProcessed] = {}

    let reasonsForFields = (action, meta) => {
      for (let key in action.fields) {
        if (isFirstOlder(this[lastProcessed][key], meta)) {
          meta.reasons.push(getReason(this, key))
        }
      }
    }

    let removeReasons = () => {
      for (let key in this[lastChanged]) {
        client.log.removeReason(getReason(this, key))
      }
    }

    this[unbind] = [
      client.type(changedType, reasonsForFields, { event: 'preadd', id }),
      client.type(changeType, reasonsForFields, { event: 'preadd', id }),
      client.type(deletedType, removeReasons, { id }),
      client.type(
        deleteType,
        async (action, meta) => {
          try {
            await track(this[loguxClient], meta.id)
            removeReasons()
          } catch {
            this[loguxClient].log.changeMeta(meta.id, { reasons: [] })
          }
        },
        { id }
      ),
      client.type(
        changedType,
        (action, meta) => {
          changeIfLast(this, action.fields, meta)
          saveProcessAndClean(this, action.fields, meta)
        },
        { id }
      ),
      client.type(
        changeType,
        async (action, meta) => {
          changeIfLast(this, action.fields, meta)
          try {
            await track(this[loguxClient], meta.id)
            saveProcessAndClean(this, action.fields, meta)
            if (this.constructor.offline) {
              client.log.add(
                { ...action, type: changedType },
                { time: meta.time }
              )
            }
          } catch {
            this[loguxClient].log.changeMeta(meta.id, { reasons: [] })
            let reverting = new Set(Object.keys(action.fields))
            this[loguxClient].log
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
                        delete this[lastChanged][key]
                        reverting.delete(key)
                        revertDiff[key] = a.fields[key]
                      }
                    }
                    changeIfLast(this, revertDiff, m)
                    return reverting.size === 0 ? false : undefined
                  } else if (a.type === deleteType || a.type === deletedType) {
                    return false
                  }
                }
              })
              .then(() => {
                for (let key of reverting) {
                  this[change](key, undefined)
                }
              })
          }
        },
        { id }
      )
    ]
  }

  change (fields, value) {
    if (value) fields = { [fields]: value }
    changeIfLast(this, fields)
    if (this.constructor.remote) {
      return this[loguxClient].sync({
        type: `${this.constructor.plural}/change`,
        id: this.id,
        fields
      })
    } else {
      return this[loguxClient].log.add({
        type: `${this.constructor.plural}/changed`,
        id: this.id,
        fields
      })
    }
  }

  processCreate (action, meta) {
    this[createdAt] = meta
    changeIfLast(this, action.fields, meta)
  }

  [destroy] () {
    for (let i of this[unbind]) i()
    if (this.constructor.remote) {
      this[loguxClient].log.add(
        {
          type: 'logux/unsubscribe',
          channel: `${this.constructor.plural}/${this.id}`
        },
        {
          sync: true
        }
      )
    }
    if (!this.constructor.offline) {
      for (let key in this[lastChanged]) {
        this[loguxClient].log.removeReason(
          `${this.constructor.plural}/${this.id}/${key}`
        )
      }
    }
  }

  delete () {
    return this.constructor.delete(this[loguxClient], this.id)
  }
}

SyncMap.plural = '@logux/maps'
SyncMap.remote = true

SyncMap.create = function (client, fields) {
  let id = fields.id
  delete fields.id
  if (this.remote) {
    return client.sync({ type: `${this.plural}/create`, id, fields })
  } else {
    return client.log.add({ type: `${this.plural}/created`, id, fields })
  }
}

SyncMap.delete = function (client, id) {
  if (this.remote) {
    return client.sync({ type: `${this.plural}/delete`, id })
  } else {
    return client.log.add({ type: `${this.plural}/deleted`, id })
  }
}

module.exports = {
  lastProcessed,
  lastChanged,
  createdAt,
  SyncMap,
  offline,
  unbind
}
