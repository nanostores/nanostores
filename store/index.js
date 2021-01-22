let listeners, bunching
if (process.env.NODE_ENV === 'production') {
  listeners = Symbol()
  bunching = Symbol()
} else {
  listeners = Symbol('listeners')
  bunching = Symbol('bunching')
}

module.exports = { listeners, bunching }
