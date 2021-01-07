let subscribe, listeners, destroy, bunching, change
if (process.env.NODE_ENV === 'production') {
  subscribe = Symbol()
  listeners = Symbol()
  bunching = Symbol()
  destroy = Symbol()
  change = Symbol()
} else {
  subscribe = Symbol('subscribe')
  listeners = Symbol('listeners')
  bunching = Symbol('bunching')
  destroy = Symbol('destroy')
  change = Symbol('change')
}

module.exports = { change, destroy, subscribe, listeners, bunching }
