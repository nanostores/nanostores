let subscribe, listeners, destroy, bunching, change, trigger
if (process.env.NODE_ENV === 'production') {
  subscribe = Symbol()
  listeners = Symbol()
  bunching = Symbol()
  destroy = Symbol()
  trigger = Symbol()
  change = Symbol()
} else {
  subscribe = Symbol('subscribe')
  listeners = Symbol('listeners')
  bunching = Symbol('bunching')
  destroy = Symbol('destroy')
  trigger = Symbol('trigger')
  change = Symbol('change')
}

module.exports = { change, destroy, subscribe, listeners, bunching, trigger }
