let lastProcessed,
  lastChanged,
  loading,
  loaded,
  listeners,
  emitter,
  loguxClient,
  destroy

if (process.env.NODE_ENV === 'production') {
  lastProcessed = Symbol()
  loguxClient = Symbol()
  lastChanged = Symbol()
  listeners = Symbol()
  emitter = Symbol()
  loading = Symbol()
  destroy = Symbol()
  loaded = Symbol()
} else {
  lastProcessed = Symbol('lastProcessed')
  loguxClient = Symbol('loguxClient')
  lastChanged = Symbol('lastChanged')
  listeners = Symbol('listeners')
  loading = Symbol('loading')
  emitter = Symbol('emitter')
  destroy = Symbol('destroy')
  loaded = Symbol('loaded')
}

module.exports = {
  lastProcessed,
  lastChanged,
  loguxClient,
  listeners,
  loading,
  emitter,
  destroy,
  loaded
}
