import { atom } from '../atom/index.js'
import { onMount } from '../lifecycle/index.js'

let computedStore = (stores, cb, batched) => {
  if (!Array.isArray(stores)) stores = [stores]

  let set = function (ctx) {
    let $computedCtx = ctx($computed)

    let args = stores.map($store => ctx($store).get())
    if (
      $computedCtx.da === undefined ||
      args.some((arg, i) => arg !== $computedCtx.da[i])
    ) {
      // [d]iamond [a]rgs
      $computedCtx.da = args
      $computedCtx.set(cb(...args, ctx))
    }
  }

  let $computed = atom(undefined, Math.max(...stores.map(s => s.l)) + 1)

  let timer
  let run = batched
    ? ctx => {
        clearTimeout(timer)
        timer = setTimeout(() => set(ctx))
      }
    : set

  onMount($computed, ({ ctx }) => {
    let unbinds = stores.map($store =>
      ctx($store).listen(() => run(ctx), $computed.l)
    )
    set(ctx)
    return () => {
      for (let unbind of unbinds) unbind()
    }
  })

  return $computed
}

export let computed = (stores, fn) => computedStore(stores, fn)
export let batched = (stores, fn) => computedStore(stores, fn, true)
