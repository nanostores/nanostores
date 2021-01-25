let { track, LoguxUndoError } = require('@logux/client')
let { isFirstOlder } = require('@logux/core')

let { STORE_RESERVED_KEYS } = require('../store')
let { LoguxClientStore } = require('../logux-client-store')

function changeIfLast (store, fields, meta) {
  let changes = {}
  for (let key in fields) {
    if (!meta || isFirstOlder(store.keyLastChanged[key], meta)) {
      changes[key] = fields[key]
      if (meta) store.keyLastChanged[key] = meta
    }
  }
  for (let key in changes) {
    store.changeKey(key, changes[key])
  }
}

function getReason (store, key) {
  return `${store.constructor.plural}/${store.id}/${key}`
}

function saveProcessAndClean (store, fields, meta) {
  for (let key in fields) {
    if (isFirstOlder(store.keyLastProcessed[key], meta)) {
      store.keyLastProcessed[key] = meta
    }
    store.loguxClient.log.removeReason(getReason(store, key), {
      olderThan: store.keyLastProcessed[key]
    })
  }
}

class SyncMapBase extends LoguxClientStore {
  static create (client, fields) {
    let id = fields.id
    delete fields.id
    if (this.remote) {
      return client.sync({ type: `${this.plural}/create`, id, fields })
    } else {
      return client.log.add({ type: `${this.plural}/created`, id, fields })
    }
  }

  static createAndReturn (client, fields) {
    let id = fields.id
    delete fields.id
    let metaId = client.log.generateId()
    let action = { type: `${this.plural}/created`, id, fields }
    let meta = { id: metaId, time: parseInt(metaId) }
    if (this.remote) meta.sync = true
    client.log.add(action, meta)
    let instance = new this(id, client, action, meta)
    if (!this.loaded) this.loaded = new Map()
    this.loaded.set(id, instance)
    return instance
  }

  static delete (client, id) {
    if (this.remote) {
      return client.sync({ type: `${this.plural}/delete`, id })
    } else {
      return client.log.add({ type: `${this.plural}/deleted`, id })
    }
  }

  constructor (id, client, createAction, createMeta) {
    super(id, client)

    this.keyLastChanged = {}
    this.keyLastProcessed = {}

    let deletedType = `${this.constructor.plural}/deleted`
    let deleteType = `${this.constructor.plural}/delete`
    let createdType = `${this.constructor.plural}/created`
    let createType = `${this.constructor.plural}/create`
    let changeType = `${this.constructor.plural}/change`
    let changedType = `${this.constructor.plural}/changed`

    let loadingResolve, loadingReject, loadingError
    let subscribe = {
      type: 'logux/subscribe',
      channel: `${this.constructor.plural}/${this.id}`
    }

    if (createAction) {
      this.isLoading = false
      this.storeLoading = Promise.resolve()
      this.createdActionMeta = createMeta
      for (let key in createAction.fields) {
        this[key] = createAction.fields[key]
        this.keyLastChanged[key] = createMeta
      }
      if (this.constructor.remote) {
        client.log.add({ ...subscribe, creating: true }, { sync: true })
      }
    } else {
      this.isLoading = true
      this.storeLoading = new Promise((resolve, reject) => {
        loadingResolve = resolve
        loadingReject = reject
      })
      if (this.constructor.remote) {
        client
          .sync(subscribe)
          .then(() => {
            if (this.isLoading) {
              this.isLoading = false
              loadingResolve()
            }
          })
          .catch(e => {
            loadingError = true
            loadingReject(e)
          })
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
              if (found && this.isLoading) {
                this.isLoading = false
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
    }

    let reasonsForFields = (action, meta) => {
      for (let key in action.fields) {
        if (isFirstOlder(this.keyLastProcessed[key], meta)) {
          meta.reasons.push(getReason(this, key))
        }
      }
    }

    let removeReasons = () => {
      for (let key in this.keyLastChanged) {
        client.log.removeReason(getReason(this, key))
      }
    }

    this.logListeners = [
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
            await track(client, meta.id)
            saveProcessAndClean(this, action.fields, meta)
            if (this.constructor.offline) {
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
                        delete this.keyLastChanged[key]
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
                  this.changeKey(key, undefined)
                }
              })
          }
        },
        { id }
      )
    ]

    if (this.constructor.remote) {
      this.logListeners.push(() => {
        if (!loadingError) {
          this.loguxClient.log.add(
            { type: 'logux/unsubscribe', channel: subscribe.channel },
            { sync: true }
          )
        }
      })
    }
  }

  change (fields, value) {
    if (value) fields = { [fields]: value }
    changeIfLast(this, fields)
    if (this.constructor.remote) {
      return this.loguxClient.sync({
        type: `${this.constructor.plural}/change`,
        id: this.id,
        fields
      })
    } else {
      return this.loguxClient.log.add({
        type: `${this.constructor.plural}/changed`,
        id: this.id,
        fields
      })
    }
  }

  toJSON () {
    let result = {}
    for (let key in this) {
      if (
        typeof key === 'string' &&
        !STORE_RESERVED_KEYS.has(key) &&
        typeof this[key] !== 'function'
      ) {
        result[key] = this[key]
      }
    }
    return result
  }

  delete () {
    return this.constructor.delete(this.loguxClient, this.id)
  }

  destroy () {
    for (let i of this.logListeners) i()
    if (!this.constructor.offline) {
      for (let key in this.keyLastChanged) {
        this.loguxClient.log.removeReason(
          `${this.constructor.plural}/${this.id}/${key}`
        )
      }
    }
  }
}

/* The hack to fix tree-shaking for static properties */
let SyncMap = /*#__PURE__*/ (function () {
  SyncMapBase.plural = '@logux/maps'
  SyncMapBase.remote = true
  return SyncMapBase
})()

module.exports = { SyncMap }
