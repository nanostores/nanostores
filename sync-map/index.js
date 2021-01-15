let { isFirstOlder } = require('@logux/core')
let { track } = require('@logux/client')

let { ClientLogStore, loguxClient } = require('../client-log-store')
let { loading, loaded } = require('../remote-store')
let { destroy, change } = require('../store')

let lastProcessed, lastChanged, offline, unbind

if (process.env.NODE_ENV === 'production') {
  lastProcessed = Symbol()
  lastChanged = Symbol()
  unbind = Symbol()
} else {
  lastProcessed = Symbol('lastProcessed')
  lastChanged = Symbol('lastChanged')
  unbind = Symbol('unbind')
}

function changeIfLast (store, diff, meta) {
  let changes = {}
  for (let key in diff) {
    if (!meta || isFirstOlder(store[lastChanged][key], meta)) {
      changes[key] = diff[key]
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

function saveProcessAndClean (store, diff, meta) {
  for (let key in diff) {
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

    if (!this.constructor.plural) {
      this.constructor.plural = '@logux/maps'
    }
    let changeType = `${this.constructor.plural}/change`
    let changedType = `${this.constructor.plural}/changed`

    let loadingResolve, loadingReject
    this[loaded] = false
    this[loading] = new Promise((resolve, reject) => {
      loadingResolve = resolve
      loadingReject = reject
    }).then(() => {
      this[loaded] = true
    })
    if (this.constructor.remote) {
      client
        .sync({
          type: 'logux/subscribe',
          channel: `${this.constructor.plural}/${this.id}`
        })
        .then(() => {
          if (!this[loaded]) loadingResolve()
        })
        .catch(loadingReject)
    }
    Promise.resolve().then(() => {
      if (this.constructor.offline) {
        let found
        client.log
          .each((action, meta) => {
            if (action.id === this.id && action.type === changedType) {
              changeIfLast(this, action.diff, meta)
              found = true
            }
          })
          .then(() => {
            if (found && !this[loaded]) loadingResolve()
          })
      }
    })

    this[lastChanged] = {}
    this[lastProcessed] = {}

    this[unbind] = [
      client.type(
        changedType,
        (action, meta) => {
          for (let key in action.diff) {
            if (isFirstOlder(this[lastProcessed][key], meta)) {
              meta.reasons.push(getReason(this, key))
            }
          }
        },
        { event: 'preadd', id }
      ),
      client.type(
        changeType,
        (action, meta) => {
          for (let key in action.diff) {
            meta.reasons.push(getReason(this, key))
          }
        },
        { event: 'preadd', id }
      ),
      client.type(
        changedType,
        async (action, meta) => {
          changeIfLast(this, action.diff, meta)
          saveProcessAndClean(this, action.diff, meta)
        },
        { id }
      ),
      client.type(
        changeType,
        async (action, meta) => {
          changeIfLast(this, action.diff, meta)
          try {
            await track(this[loguxClient], meta.id)
            saveProcessAndClean(this, action.diff, meta)
            if (this.constructor.offline) {
              client.log.add(
                { ...action, type: changedType },
                { time: meta.time }
              )
            }
          } catch {
            this[loguxClient].log.changeMeta(meta.id, { reasons: [] })
            let reverting = new Set(Object.keys(action.diff))
            this[loguxClient].log.each((a, m) => {
              if (
                a.id === id &&
                m.id !== meta.id &&
                (a.type === changeType || a.type === changedType) &&
                Object.keys(a.diff).some(i => reverting.has(i))
              ) {
                let revertDiff = {}
                for (let key in a.diff) {
                  if (reverting.has(key)) {
                    delete this[lastChanged][key]
                    reverting.delete(key)
                    revertDiff[key] = a.diff[key]
                  }
                }
                changeIfLast(this, revertDiff, m)
              }
              return reverting.size === 0 ? false : undefined
            })
          }
        },
        { id }
      )
    ]
  }

  change (diff, value) {
    if (value) diff = { [diff]: value }
    changeIfLast(this, diff)
    if (this.constructor.remote) {
      return this[loguxClient].sync({
        type: `${this.constructor.plural}/change`,
        id: this.id,
        diff
      })
    } else {
      return this[loguxClient].log.add({
        type: `${this.constructor.plural}/changed`,
        id: this.id,
        diff
      })
    }
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
    return this[loguxClient].sync({
      type: `${this.constructor.plural}/delete`,
      id: this.id
    })
  }
}

SyncMap.remote = true

SyncMap.create = function (client, fields) {
  let prefix = this.plural || '@logux/maps'
  return client.sync({ type: `${prefix}/create`, fields })
}

module.exports = { lastProcessed, lastChanged, SyncMap, offline, unbind }
