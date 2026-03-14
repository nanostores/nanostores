let warned = {}

export function warn(text) {
  if (!warned[text]) {
    warned[text] = true
    if (typeof console !== 'undefined' && console.warn) {
      console.groupCollapsed('Nano Stores: ' + text)
      console.trace('Source of deprecated call')
      console.groupEnd()
    }
  }
}
