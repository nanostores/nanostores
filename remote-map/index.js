let { isFirstOlder } = require('@logux/core')
let { track } = require('@logux/client')

let {
  RemoteStore,
  loguxClient,
  loading,
  loaded,
  emitter,
  destroy
} = require('../store')

let lastProcessed, lastChanged, unbind

if (process.env.NODE_ENV === 'production') {
  lastProcessed = Symbol()
  lastChanged = Symbol()
  unbind = Symbol()
} else {
  lastProcessed = Symbol('lastProcessed')
  lastChanged = Symbol('lastChanged')
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

class RemoteMap extends RemoteStore {
  constructor (client, id) {
    super(client, id)

    if (!this.constructor.plural) {
      this.constructor.plural = '@logux/maps'
    }
    let changeType = `${this.constructor.plural}/change`
    let changedType = `${this.constructor.plural}/changed`

    this[loaded] = false
    this[loading] = client
      .sync({
        type: 'logux/subscribe',
        channel: `${this.constructor.plural}/${this.id}`
      })
      .then(() => {
        this[loaded] = true
      })

    this[lastChanged] = {}
    this[lastProcessed] = {}

    this[unbind] = [
      client.type(
        changedType,
        (action, meta) => {
          if (action.id === id) {
            for (let key in action.diff) {
              if (isFirstOlder(this[lastProcessed][key], meta)) {
                meta.reasons.push(getReason(this, key))
              }
            }
          }
        },
        'preadd'
      ),
      client.type(
        changeType,
        (action, meta) => {
          if (action.id === id) {
            for (let key in action.diff) {
              meta.reasons.push(getReason(this, key))
            }
          }
        },
        'preadd'
      ),
      client.type(changedType, async (action, meta) => {
        if (action.id !== id) return
        change(this, action.diff, meta)
        saveProcessAndClean(this, action.diff, meta)
      }),
      client.type(changeType, async (action, meta) => {
        if (action.id !== id) return
        change(this, action.diff, meta)
        try {
          await track(this[loguxClient], meta.id)
          saveProcessAndClean(this, action.diff, meta)
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
      })
    ]
  }

  change (diff, value) {
    if (value) {
      diff = { [diff]: value }
    }
    change(this, diff)
    return this[loguxClient].sync({
      type: `${this.constructor.plural}/change`,
      id: this.id,
      diff
    })
  }

  [destroy] () {
    for (let i of this[unbind]) i()
    for (let key in this[lastChanged]) {
      this[loguxClient].log.removeReason(
        `${this.constructor.plural}/${this.id}/${key}`
      )
    }
  }
}

module.exports = { RemoteMap, lastProcessed, lastChanged, unbind }
