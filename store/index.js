let listeners, bunching, change
if (process.env.NODE_ENV === 'production') {
  listeners = Symbol()
  bunching = Symbol()
  change = Symbol()
} else {
  listeners = Symbol('listeners')
  bunching = Symbol('bunching')
  change = Symbol('change')
}

module.exports = { change, listeners, bunching }
