let { isFirstOlder } = require('@logux/core')
let { track } = require('@logux/client')

let { Model } = require('../model')

let change
if (process.env.NODE_ENV === 'production') {
  change = (model, key, value, meta) => {
    let prev = model[key]
    model[key] = value
    if (meta) model.last[key] = meta
    if (prev !== value) model.emitter.emit('change', model, key)
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
    if (meta) model.last[key] = meta
    if (prev !== value) model.emitter.emit('change', model, key)
  }
}

function getReason (model, key) {
  return `${model.constructor.modelsName}/${model.id}/${key}`
}

function saveProcessAndClean (model, key, meta) {
  if (isFirstOlder(model.processed[key], meta)) {
    model.processed[key] = meta
  }
  model.client.log.removeReason(getReason(model, key), {
    olderThan: model.processed[key]
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

    this.modelLoaded = false
    this.modelLoading = this.client
      .sync({
        type: 'logux/subscribe',
        channel: `${models}/${this.id}`
      })
      .then(() => {
        this.modelLoaded = true
      })

    this.last = {}
    this.processed = {}

    this.unbind = [
      this.client.type(
        changedType,
        (action, meta) => {
          if (action.id !== id) return
          let key = action.key
          if (isFirstOlder(this.processed[key], meta)) {
            meta.reasons.push(getReason(this, key))
          }
        },
        'preadd'
      ),
      this.client.type(
        changeType,
        (action, meta) => {
          if (action.id === id) {
            meta.reasons.push(getReason(this, action.key))
          }
        },
        'preadd'
      ),
      this.client.type(changedType, async (action, meta) => {
        if (action.id !== id) return
        let key = action.key
        if (isFirstOlder(this.last[key], meta)) {
          change(this, key, action.value, meta)
        }
        saveProcessAndClean(this, key, meta)
      }),
      this.client.type(changeType, async (action, meta) => {
        if (action.id !== id) return
        let key = action.key
        if (isFirstOlder(this.last[key], meta)) {
          change(this, key, action.value, meta)
        }
        try {
          await track(this.client, meta.id)
          this.processed[key] = meta
          saveProcessAndClean(this, key, meta)
        } catch {
          this.client.log.changeMeta(meta.id, { reasons: [] })
          this.client.log.each((a, m) => {
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
    return this.client.sync({
      type: `${this.constructor.modelsName}/change`,
      key,
      value,
      id: this.id
    })
  }

  destroy () {
    for (let i of this.unbind) i()
    for (let key in this.last) {
      this.client.log.removeReason(
        `${this.constructor.modelsName}/${this.id}/${key}`
      )
    }
  }
}

module.exports = { RemoteMap }
