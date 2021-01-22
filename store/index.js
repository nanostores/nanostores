let listeners, destroy, bunching, change
if (process.env.NODE_ENV === 'production') {
  listeners = Symbol()
  bunching = Symbol()
  destroy = Symbol()
  change = Symbol()
} else {
  listeners = Symbol('listeners')
  bunching = Symbol('bunching')
  destroy = Symbol('destroy')
  change = Symbol('change')
}

module.exports = { change, destroy, listeners, bunching }
