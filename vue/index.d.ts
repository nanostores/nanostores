import { DeepReadonly, UnwrapRef } from 'vue'

import { Store } from '../create-store/index.js'

type ReadonlyRef<Type> = DeepReadonly<{ value: UnwrapRef<Type> }>

/**
 * Subscribe to store changes and get store’s value.
 *
 * ```js
 * import { useStore } from '@logux/state/vue'
 * import { router } from '@logux/state'
 *
 * export const Layout: FC = () => {
 *   let page = useStore(router)
 *   if (page.router === 'home') {
 *     return <HomePage />
 *   } else {
 *     return <Error404 />
 *   }
 * }
 * ```
 *
 * @param store Store instance.
 * @returns Store value.
 */
export function useStore<Value extends any>(
  store: Store<Value>
): ReadonlyRef<Value>
