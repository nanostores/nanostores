let { isFirstOlder } = require('@logux/core')
let { track } = require('@logux/client')

let {
  lastProcessed,
  lastChanged,
  loguxClient,
  loading,
  loaded,
  emitter,
  destroy,
  unbind
} = require('../symbols')
let { RemoteStore } = require('../store')

let change
if (process.env.NODE_ENV === 'production') {
  change = (store, key, value, meta) => {
    let prev = store[key]
    store[key] = value
    if (meta) store[lastChanged][key] = meta
    if (prev !== value) store[emitter].emit('change', store, key)
  }
} else {
  change = (store, key, value, meta) => {
    let prev = store[key]
    Object.defineProperty(store, key, {
      configurable: true,
      enumerable: true,
      writable: false,
      value
    })
    if (meta) store[lastChanged][key] = meta
    if (prev !== value) store[emitter].emit('change', store, key)
  }
}

function getReason (store, key) {
  return `${store.constructor.plural}/${store.id}/${key}`
}

function saveProcessAndClean (store, key, meta) {
  if (isFirstOlder(store[lastProcessed][key], meta)) {
    store[lastProcessed][key] = meta
  }
  store[loguxClient].log.removeReason(getReason(store, key), {
    olderThan: store[lastProcessed][key]
  })
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
          if (action.id !== id) return
          let key = action.key
          if (isFirstOlder(this[lastProcessed][key], meta)) {
            meta.reasons.push(getReason(this, key))
          }
        },
        'preadd'
      ),
      client.type(
        changeType,
        (action, meta) => {
          if (action.id === id) {
            meta.reasons.push(getReason(this, action.key))
          }
        },
        'preadd'
      ),
      client.type(changedType, async (action, meta) => {
        if (action.id !== id) return
        let key = action.key
        if (isFirstOlder(this[lastChanged][key], meta)) {
          change(this, key, action.value, meta)
        }
        saveProcessAndClean(this, key, meta)
      }),
      client.type(changeType, async (action, meta) => {
        if (action.id !== id) return
        let key = action.key
        if (isFirstOlder(this[lastChanged][key], meta)) {
          change(this, key, action.value, meta)
        }
        try {
          await track(this[loguxClient], meta.id)
          this[lastProcessed][key] = meta
          saveProcessAndClean(this, key, meta)
        } catch {
          this[loguxClient].log.changeMeta(meta.id, { reasons: [] })
          this[loguxClient].log.each((a, m) => {
            if (
              a.id === id &&
              m.id !== meta.id &&
              (a.type === changeType || a.type === changedType)
            ) {
              change(this, key, a.value, m)
              return false
            } else {
              return undefined
            }
          })
        }
      })
    ]
  }

  change (key, value) {
    change(this, key, value)
    return this[loguxClient].sync({
      type: `${this.constructor.plural}/change`,
      key,
      value,
      id: this.id
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

module.exports = { RemoteMap }
