let { isFirstOlder } = require('@logux/core')
let { track } = require('@logux/client')

let {
  lastProcessed,
  lastChanged,
  loguxClient,
  loading,
  loaded,
  emitter,
  destroy
} = require('../symbols')
let { Model } = require('../model')

let change
if (process.env.NODE_ENV === 'production') {
  change = (model, key, value, meta) => {
    let prev = model[key]
    model[key] = value
    if (meta) model[lastChanged][key] = meta
    if (prev !== value) model[emitter].emit('change', model, key)
  }
} else {
  change = (model, key, value, meta) => {
    let prev = model[key]
    Object.defineProperty(model, key, {
      configurable: true,
      enumerable: true,
      writable: false,
      value
    })
    if (meta) model[lastChanged][key] = meta
    if (prev !== value) model[emitter].emit('change', model, key)
  }
}

function getReason (model, key) {
  return `${model.constructor.modelsName}/${model.id}/${key}`
}

function saveProcessAndClean (model, key, meta) {
  if (isFirstOlder(model[lastProcessed][key], meta)) {
    model[lastProcessed][key] = meta
  }
  model[loguxClient].log.removeReason(getReason(model, key), {
    olderThan: model[lastProcessed][key]
  })
}

class RemoteMap extends Model {
  constructor (client, id) {
    super(client, id)

    if (!this.constructor.modelsName) {
      this.constructor.modelsName = '@logux/maps'
    }
    let models = this.constructor.modelsName
    let changeType = `${models}/change`
    let changedType = `${models}/changed`

    this[loaded] = false
    this[loading] = client
      .sync({
        type: 'logux/subscribe',
        channel: `${models}/${this.id}`
      })
      .then(() => {
        this[loaded] = true
      })

    this[lastChanged] = {}
    this[lastProcessed] = {}

    this.unbind = [
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
      type: `${this.constructor.modelsName}/change`,
      key,
      value,
      id: this.id
    })
  }

  [destroy] () {
    for (let i of this.unbind) i()
    for (let key in this[lastChanged]) {
      this[loguxClient].log.removeReason(
        `${this.constructor.modelsName}/${this.id}/${key}`
      )
    }
  }
}

module.exports = { RemoteMap }
