import { Store } from '../create-store/index.js'

type Params<N extends string> = {
  [name in N]: string
}

type Pages = {
  [name: string]: any
}

type Pattern<D> = [RegExp, (...parts: string[]) => D]

type Routes<P extends Pages> = {
  [name in keyof P]: string | Pattern<Params<P[name]>>
}

export type RouteParams<P extends Pages, N extends keyof P> = P[N] extends void
  ? []
  : [Params<P[N]>]

export type Page<
  P extends Pages = Pages,
  C extends keyof P = any
> = C extends any
  ? {
      path: string
      route: C
      params: Params<P[C]>
    }
  : never

/**
 * Router store. Use {@link createRouter} to create it.
 *
 * It is a simple router without callbacks. Think about it as a URL parser.
 *
 * ```js
 * import { useStore, openPage } from '@logux/state'
 *
 * import { router } from '../stores'
 *
 * export class Layout = () => {
 *   let page = useStore(router)
 *   if (page.name === 'post') {
 *     return <PostPage
 *      id={page.params.id}
 *      category={page.params.category}
 *     />
 *   } else if (page.name === 'exit') {
 *     forgetAuth()
 *     openPage(router, 'home')
 *   } else {
 *     return <NotFound />
 *   }
 * }
 * ```
 *
 * ```js
 * import { createRouter } from '@logux/state'
 *
 * // Types for TypeScript
 * interface Routes {
 *   home: void
 *   category: 'categoryId'
 *   post: 'categoryId' | 'id'
 * }
 *
 * export const router = createRouter<Routes>({
 *   home: '/',
 *   category: '/posts/:categoryId',
 *   post: '/posts/:category/:id'
 * })
 * ```
 */
export type Router<P extends Pages = Pages> = Store<
  Page<P, keyof P> | undefined
> & {
  /**
   * Converted routes.
   */
  routes: [string, RegExp, (...params: string[]) => object, string?][]

  /**
   * Open URL without page reloading.
   *
   * ```js
   * router.open('/posts/guides/10')
   * ```
   *
   * @param path Absolute URL (`https://example.com/a`)
   *             or domain-less URL (`/a`).
   */
  open(path: string): void
}

/**
 * Create {@link Router} store.
 *
 * ```js
 * import { createRouter } from '@logux/state'
 *
 * // Types for TypeScript
 * interface Routes {
 *   home: void
 *   category: 'categoryId'
 *   post: 'categoryId' | 'id'
 * }
 *
 * export const router = createRouter<Routes>({
 *   home: '/',
 *   category: '/posts/:categoryId',
 *   post: '/posts/:category/:id'
 * })
 * ```
 *
 * @param routes URL patterns.
 */
export function createRouter<P extends Pages> (routes: Routes<P>): Router<P>

/**
 * Open page by name and parameters.
 *
 * ```js
 * import { openPage } from '@logux/state'
 *
 * openPage(router, 'post', { categoryId: 'guides', id: '10' })
 * ```
 *
 * @param name Route name.
 * @param params Route parameters.
 */
export function openPage<P extends Pages, N extends keyof P> (
  router: Router<P>,
  name: N,
  ...params: P[N] extends void ? [] : [Params<P[N]>]
): void

/**
 * Open page by name and parameters.
 *
 * ```js
 * import { getPageUrl } from '@logux/state'
 *
 * getPageUrl(router, 'post', { categoryId: 'guides', id: '10' })
 * //=> '/posts/guides/10'
 * ```
 *
 * @param name Route name.
 * @param params Route parameters.
 */
export function getPagePath<P extends Pages, N extends keyof P> (
  router: Router<P>,
  name: N,
  ...params: RouteParams<P, N>
): string
