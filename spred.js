const IS_COMPUTING = -1
const HAS_EXCEPTION = -2
const WAS_SET = -3
let computing = null
let scope = null
let globalVersion = 1
let notificationVersion = 1
let batchLevel = 0
let checkLevel = 0
let deactivateLevel = 0
let lastTriggeredWritablesLength = 0
let shouldInvalidate = false
let triggeredWritables = []
let linksToSubscribers = []
let signalsToDeactivate = []
const _value = Symbol()
const _nextValue = Symbol()
const _version = Symbol()
const _updated = Symbol()
const _notified = Symbol()
const _compute = Symbol()
const _exception = Symbol()
const _cursor = Symbol()
const _firstSource = Symbol()
const _lastTarget = Symbol()
const _computing = Symbol()
const _children = Symbol()
const _options = Symbol()
/**
 * Special value indicating no result.
 *
 * Return `NONE` from a computation to keep the current value and skip the update.
 * Computed signals start as `NONE` until the first successful evaluation.
 */
const NONE = Symbol('NONE')
/** @internal */
function Signal(compute, options) {
  this[_version] = 0
  this[_updated] = 0
  this[_notified] = 0
  this[_value] = NONE
  this[_cursor] = null
  this[_firstSource] = null
  this[_lastTarget] = null
  this[_computing] = null
  this[_compute] = compute
  this[_options] = options
  if (compute) this[_options]?.onCreate?.(this[_value])
  const parent = computing || scope
  if (parent) addChild(parent, this)
}
Signal.prototype.subscribe = function (subscriber, immediate = true) {
  ++batchLevel
  const value = this.get()
  const link = createLink(this, subscriber)
  link.c = value
  addTarget(this, link)
  if (immediate && this[_version] !== HAS_EXCEPTION) {
    try {
      subscriber(value)
    } catch (e) {
      console.error(e)
    }
  }
  --batchLevel
  sync()
  const dispose = () => {
    const source = link.s
    if (!source) return
    link.s = null
    link.c = null
    removeTarget(source, link, true)
  }
  const parent = computing || scope
  if (parent) addChild(parent, dispose)
  return dispose
}
function addTarget(signal, link) {
  let lt = signal[_lastTarget]
  link.pt = lt
  signal[_lastTarget] = link
  if (lt) {
    lt.nt = link
    return
  }
  for (let link = signal[_firstSource]; link; link = link.ns) {
    addTarget(link.s, link)
  }
  const onDeactivate = signal[_options]?.onActivate?.(signal[_value])
  if (typeof onDeactivate === 'function') {
    if (!signal[_options]) signal[_options] = {}
    signal[_options].onDeactivate = onDeactivate
  }
}
function removeTarget(signal, link, deactivateImmediately) {
  if (signal[_lastTarget] === link) signal[_lastTarget] = link.pt
  if (link.pt) link.pt.nt = link.nt
  if (link.nt) link.nt.pt = link.pt
  link.pt = null
  link.nt = null
  if (deactivateImmediately) deactivate(signal)
  else signalsToDeactivate.push(signal)
}
function deactivate(signal) {
  if (signal[_lastTarget]) return
  if (deactivateLevel === 0) shouldInvalidate = false
  ++deactivateLevel
  for (let link = signal[_firstSource]; link; link = link.ns) {
    removeTarget(link.s, link, true)
  }
  --deactivateLevel
  try {
    signal[_options]?.onCleanup?.(signal[_value])
    signal[_options]?.onDeactivate?.(signal[_value])
  } catch (e) {
    console.error(e)
  }
  if (!signal[_compute] && signal[_options]?.getInitialValue) {
    signal[_updated] = globalVersion + 1
    shouldInvalidate = true
  }
  if (shouldInvalidate && !deactivateLevel && !batchLevel) {
    ++globalVersion
  }
}
function addChild(parent, child) {
  if (!parent[_children]) parent[_children] = []
  parent[_children].push(child)
}
function cleanupChildren(parent) {
  for (let child of parent[_children]) {
    if (typeof child === 'function') child()
    else if (child[_children]) cleanupChildren(child)
  }
  parent[_children] = []
}
Object.defineProperty(Signal.prototype, 'value', {
  get() {
    return this.get()
  }
})
Signal.prototype.get = function () {
  if (this[_version] === IS_COMPUTING) {
    throw new Error('Circular dependency')
  }
  if (triggeredWritables.length > lastTriggeredWritablesLength) {
    ++globalVersion
    lastTriggeredWritablesLength = triggeredWritables.length
  }
  if (!computing) shouldInvalidate = false
  if (
    this[_version] < globalVersion &&
    (computing ||
      !this[_lastTarget] ||
      !this[_compute] ||
      this[_notified] === globalVersion ||
      triggeredWritables.length)
  ) {
    const version = this[_version]
    const hasException = version === HAS_EXCEPTION
    let shouldCompute = false
    this[_version] = IS_COMPUTING
    if (!this[_firstSource] || hasException) {
      shouldCompute = true
    } else {
      ++checkLevel
      try {
        for (let link = this[_firstSource]; link; link = link.ns) {
          const source = link.s
          if (source[_updated] <= version) source.get()
          if (source[_updated] > version) {
            shouldCompute = true
            break
          }
        }
      } catch (e) {
        shouldCompute = true
      }
      --checkLevel
    }
    if (shouldCompute) {
      const tempComputing = computing
      const currentValue = this[_value]
      computing = this
      if (this[_compute]) {
        this[_options]?.onCleanup?.(currentValue)
        if (this[_children]) {
          cleanupChildren(this)
        }
      }
      try {
        const shouldInit =
          !this[_lastTarget] &&
          this[_options]?.getInitialValue &&
          !this[_compute]
        if (shouldInit) {
          if (version !== WAS_SET)
            this[_nextValue] = this[_options]?.getInitialValue()
          shouldInvalidate = true
        }
        const nextValue = this[_compute]
          ? this[_compute](get)
          : this[_nextValue]
        const equal = this[_options]?.equal
        if (
          nextValue !== NONE &&
          (equal === false ||
            currentValue === NONE ||
            !(equal || Object.is)(nextValue, currentValue))
        ) {
          this[_value] = nextValue
          this[_updated] = shouldInit ? globalVersion + 1 : globalVersion
          this[_options]?.onUpdate?.(nextValue, currentValue)
        }
      } catch (e) {
        this[_exception] = e
        this[_version] = HAS_EXCEPTION
      }
      if (this[_cursor]) {
        const next = this[_cursor].ns
        for (let link = this[_firstSource]; link !== next; link = link.ns) {
          link.s[_computing] = link.c
          link.c = null
        }
        if (next) {
          this[_cursor].ns = null
          for (let link = next; link; link = link.ns) {
            removeTarget(link.s, link)
          }
        }
      }
      this[_cursor] = null
      computing = tempComputing
    }
    if (this[_version] !== HAS_EXCEPTION) {
      this[_version] = globalVersion
      if (hasException) this[_exception] = undefined
    }
  }
  if (this[_version] === HAS_EXCEPTION) {
    if (computing || checkLevel) throw this[_exception]
    else console.error(this[_exception])
    this[_options]?.onException?.(this[_exception], this[_value])
  }
  if (!computing) {
    if (shouldInvalidate && !this[_lastTarget]) ++globalVersion
    if (triggeredWritables.length) sync()
  }
  return this[_value]
}
/** @internal */
function WritableSignal(value, options) {
  Signal.call(this, undefined, options)
  this[_value] = value
  this[_nextValue] = value
  this[_options]?.onCreate?.(this[_value])
}
WritableSignal.prototype = new Signal()
WritableSignal.prototype.constructor = WritableSignal
WritableSignal.prototype.set = function (value) {
  if (value === NONE) return
  this[_version] = WAS_SET
  this[_nextValue] = value
  triggeredWritables.push(this)
  sync()
}
WritableSignal.prototype.update = function (updateFn) {
  this.emit(updateFn(this[_nextValue]))
}
WritableSignal.prototype.emit = function (value) {
  this[_updated] = globalVersion + 1
  this.set(arguments.length ? value : this[_nextValue])
}
function notify(stack) {
  for (let signal = stack.pop(); signal; signal = stack.pop()) {
    if (signal[_notified] === globalVersion) continue
    signal[_notified] = globalVersion
    let subs = 0
    for (let link = signal[_lastTarget]; link; link = link.pt) {
      const target = link.t
      if (typeof target === 'function') ++subs
      else if (target[_notified] !== globalVersion) stack.push(target)
      if (!link.pt) {
        for (let l = link; subs > 0 && l; l = l.nt) {
          if (typeof l.t === 'function') {
            linksToSubscribers.push(l)
            --subs
          }
        }
      }
    }
  }
}
function sync() {
  if (batchLevel || computing || !triggeredWritables.length) return
  const writables = triggeredWritables
  const notifyStack = []
  shouldInvalidate = false
  triggeredWritables = []
  ++batchLevel
  if (!lastTriggeredWritablesLength) ++globalVersion
  lastTriggeredWritablesLength = 0
  for (let i = writables.length - 1; i >= 0; i--) {
    const signal = writables[i]
    signal.get()
    if (signal[_updated] > notificationVersion) notifyStack.push(signal)
  }
  notificationVersion = globalVersion
  notify(notifyStack)
  for (let link of linksToSubscribers) {
    const signal = link.s
    if (signal) signal.get()
  }
  for (let signal of signalsToDeactivate) deactivate(signal)
  for (let link of linksToSubscribers) {
    const signal = link.s
    if (!signal) continue
    if (signal[_updated] === globalVersion) {
      try {
        link.t(signal[_value], link.c)
      } catch (e) {
        console.error(e)
      } finally {
        link.c = signal[_value]
      }
    }
  }
  --batchLevel
  if (shouldInvalidate) {
    ++globalVersion
    shouldInvalidate = false
  }
  linksToSubscribers = []
  signalsToDeactivate = []
  sync()
}
/**
 * Commits all writable signal updates made within the passed function as a single transaction.
 * @param fn A function with updates.
 */
function batch(fn) {
  ++batchLevel
  try {
    fn()
  } finally {
    --batchLevel
    sync()
  }
}
function createLink(s, t) {
  return {
    s,
    t,
    c: null,
    ns: null,
    pt: null,
    nt: null
  }
}
function get(signal) {
  let shouldAddTarget = false
  if (computing) {
    if (signal[_computing] === computing) return signal[_value]
    let cursor = computing[_cursor]
    if (cursor) {
      if (!cursor.ns) cursor.ns = createLink(null, computing)
      computing[_cursor] = cursor.ns
    } else {
      if (computing[_firstSource]) {
        computing[_cursor] = computing[_firstSource]
      } else {
        computing[_cursor] = createLink(null, computing)
        computing[_firstSource] = computing[_cursor]
      }
    }
    cursor = computing[_cursor]
    const source = cursor.s
    cursor.c = signal[_computing]
    signal[_computing] = computing
    if (source !== signal) {
      if (computing[_lastTarget]) {
        if (source) removeTarget(source, cursor)
        shouldAddTarget = true
      }
      cursor.s = signal
    }
  }
  const value = signal.get()
  if (shouldAddTarget) addTarget(signal, computing[_cursor])
  return value
}
/**
 * Creates a copy of the passed function which batches updates made during its execution.
 * @param fn A function to copy.
 * @returns A copy of the passed function with batched updates.
 */
function action(fn) {
  return function (...args) {
    ++batchLevel
    try {
      // @ts-ignore
      return fn.apply(this, args)
    } finally {
      --batchLevel
      sync()
    }
  }
}
/**
 * Calls the passed function and returns the unsubscribe function from all signals and subscriptions created within it.
 * @param fn A function to call.
 * @returns A cleanup function.
 */
function collect(fn) {
  const tempComputing = computing
  const tempScope = scope
  const fakeState = {}
  scope = fakeState
  computing = null
  try {
    fn()
  } finally {
    computing = tempComputing
    scope = tempScope
    return () => cleanupChildren(fakeState)
  }
}

/**
 * Subscribes the passed function to updates of the signal value without immediate execution.
 * @param signal The signal being subscribed to.
 * @param subscriber A function subscribed to updates.
 * @returns An unsubscribe function.
 */
function on(signal, subscriber) {
  return signal.subscribe(subscriber, false)
}

function signal(value, options) {
  if (typeof value === 'function') return new Signal(value, options)
  return new WritableSignal(value, options)
}

const NOOP_FN = () => {}

/**
 * Call the passed function immediately and every time the signals it depends on are updated.
 * @param fn A function to watch for
 * @param options Effect options.
 * @returns Stop watching function.
 */
function effect(fn, options) {
  return new Signal(fn, options).subscribe(NOOP_FN)
}

export {
  NONE,
  Signal,
  WritableSignal,
  action,
  batch,
  collect,
  effect,
  on,
  signal,
  _options
}
