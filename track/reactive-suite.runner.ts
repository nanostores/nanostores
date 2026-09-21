// Runs reactive-framework-test-suite against computed and effect with get().
// node --import tsx --test track/reactive-suite.runner.ts
import { describe, test } from 'node:test'
import {
  type ReactiveFramework,
  SkipTest,
  testSuite
} from 'reactive-framework-test-suite'

import {
  atom,
  batch,
  computed,
  effect,
  type Getter,
  type ReadableAtom
} from '../index.js'

// The suite reads a signal without any argument. The adapter keeps get()
// of the running callback here to pass the read to it.
let currentGet: Getter | undefined

function withGet<Value>(get: Getter | undefined, fn: () => Value): Value {
  let previous = currentGet
  currentGet = get
  try {
    return fn()
  } finally {
    currentGet = previous
  }
}

function read<Value>($store: ReadableAtom<Value>): Value {
  return currentGet ? currentGet($store) : $store.get()
}

let framework: ReactiveFramework = {
  batch,
  computed(fn) {
    let $computed = computed(get => withGet(get, fn))
    return { read: () => read($computed) }
  },
  effect(fn) {
    return effect(get => {
      let cleanup = withGet(get, fn)
      // get() does not work after the callback, so cleanup reads by $store.get()
      return (
        cleanup &&
        (() => {
          withGet(undefined, cleanup)
        })
      )
    })
  },
  name: 'nanostores',
  run(fn) {
    fn()
  },
  signal(initialValue) {
    let $signal = atom(initialValue)
    return {
      read: () => read($signal),
      write(value) {
        $signal.set(value)
      }
    }
  },
  untracked(fn) {
    return withGet(undefined, fn)
  }
}

for (let { cases, section } of testSuite) {
  void describe(section, () => {
    for (let [name, fn] of Object.entries(cases)) {
      void test(name, t => {
        try {
          framework.run(() => {
            fn(framework)
          })
        } catch (error) {
          if (error instanceof SkipTest) {
            t.skip(error.message)
            return
          }
          throw error
        }
      })
    }
  })
}
