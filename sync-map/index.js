let { isFirstOlder } = require('@logux/core')
let { track } = require('@logux/client')
let { delay } = require('nanodelay')

let {
  RemoteStore,
  loguxClient,
  loading,
  loaded,
  emitter,
  destroy
} = require('../store')

let lastProcessed, lastChanged, offline, unbind

if (process.env.NODE_ENV === 'production') {
  lastProcessed = Symbol()
  lastChanged = Symbol()
  offline = Symbol()
  unbind = Symbol()
} else {
  lastProcessed = Symbol('lastProcessed')
  lastChanged = Symbol('lastChanged')
  offline = Symbol('offline')
  unbind = Symbol('unbind')
}

let change
if (process.env.NODE_ENV === 'production') {
  change = (store, diff, meta) => {
    let changes = {}
    for (let key in diff) {
      if (!meta || isFirstOlder(store[lastChanged][key], meta)) {
        if (store[key] !== diff[key]) changes[key] = diff[key]
        store[key] = diff[key]
        if (meta) store[lastChanged][key] = meta
      }
    }
    if (Object.keys(changes).length > 0) {
      store[emitter].emit('change', store, changes)
    }
  }
} else {
  change = (store, diff, meta) => {
    let changes = {}
    for (let key in diff) {
      if (!meta || isFirstOlder(store[lastChanged][key], meta)) {
        if (store[key] !== diff[key]) changes[key] = diff[key]
        Object.defineProperty(store, key, {
          configurable: true,
          enumerable: true,
          writable: false,
          value: diff[key]
        })
        if (meta) store[lastChanged][key] = meta
      }
    }
    if (Object.keys(changes).length > 0) {
      store[emitter].emit('change', store, changes)
    }
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

function isOffline (store) {
  if (typeof store[offline] !== 'undefined') {
    return store[offline]
  } else {
    return store.constructor.offline
  }
}

class SyncMap extends RemoteStore {
  constructor (client, id) {
    super(client, id)

    if (process.env.NODE_ENV !== 'production') {
      if (this.constructor[offline]) {
        throw new Error(
          'Replace `static [error] = true` to `static error = true` in ' +
            this.constructor.name
        )
      }
    }

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
    delay(0).then(() => {
      if (isOffline(this)) {
        let found
        client.log
          .each((action, meta) => {
            if (action.id === this.id && action.type === changedType) {
              change(this, action.diff, meta)
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
          change(this, action.diff, meta)
          saveProcessAndClean(this, action.diff, meta)
        },
        { id }
      ),
      client.type(
        changeType,
        async (action, meta) => {
          change(this, action.diff, meta)
          try {
            await track(this[loguxClient], meta.id)
            saveProcessAndClean(this, action.diff, meta)
            if (isOffline(this)) {
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
                change(this, revertDiff, m)
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
    change(this, diff)
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
    if (!isOffline(this)) {
      for (let key in this[lastChanged]) {
        this[loguxClient].log.removeReason(
          `${this.constructor.plural}/${this.id}/${key}`
        )
      }
    }
  }
}

SyncMap.remote = true

module.exports = { lastProcessed, lastChanged, SyncMap, offline, unbind }
