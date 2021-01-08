import { LocalStoreClassWithStatic, LocalStore } from '../local-store/index.js'

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

export type CurrentPage<
  P extends Pages = Pages,
  C extends keyof P = any
> = C extends any
  ? {
      readonly name: C
      readonly params: Params<P[C]>
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
 * import { Router } from '../stores'
 *
 * export class Layout = () => {
 *   let router = useStore(Router)
 *   if (router.page.name === 'post') {
 *     return <PostPage
 *      id={router.page.params.id}
 *      category={router.page.params.category}
 *     />
 *   } else if (router.page.name === 'exit') {
 *     forgetAuth()
 *     openPage(router, 'home')
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
 * export const Router = createRouter<Routes>({
 *   home: '/',
 *   category: '/posts/:categoryId',
 *   post: '/posts/:category/:id'
 * })
 * ```
 */
export class Router<P extends Pages = Pages> extends LocalStore {
  /**
   * Curren page path.
   *
   * ```
   * router.path
   * ```
   */
  readonly path: string

  /**
   * Name and params of current page.
   */
  readonly page: CurrentPage<P, keyof P> | undefined

  /**
   * Converted routes.
   */
  routes: [string, RegExp, (...params: string[]) => object, string?][]

  /**
   * Open URL without page reloading.
   *
   * ```js
   * import { openPage } from '@logux/state'
   *
   * openUrl(router, '/posts/guides/10')
   * ```
   *
   * @param path Absolute URL (`https://example.com/a`)
   *             or domain-less URL (`/a`).
   */
  openUrl (path: string): void

  /**
   * Parse URL and change store current page.
   */
  parse (path: string): void
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
 * export const Router = createRouter<Routes>({
 *   home: '/',
 *   category: '/posts/:categoryId',
 *   post: '/posts/:category/:id'
 * })
 * ```
 *
 * @param routes
 */
export function createRouter<P extends Pages> (
  routes: Routes<P>
): LocalStoreClassWithStatic<Router<P>>

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
  ...params: P[N] extends void ? [] : [Params<P[N]>]
): string
