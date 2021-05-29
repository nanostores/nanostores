import { Store } from '../create-store/index.js'

type Params<Names extends string> = {
  [name in Names]: string
}

interface Pages {
  [name: string]: any
}

type Pattern<RouteParams> = [RegExp, (...parts: string[]) => RouteParams]

type Routes<AppPages extends Pages> = {
  [name in keyof AppPages]: string | Pattern<Params<AppPages[name]>>
}

export type RouteParams<
  AppPages extends Pages,
  PageName extends keyof AppPages
> = AppPages[PageName] extends void ? [] : [Params<AppPages[PageName]>]

export type Page<
  AppPages extends Pages = Pages,
  PageName extends keyof AppPages = any
> = PageName extends any
  ? {
      path: string
      route: PageName
      params: Params<AppPages[PageName]>
    }
  : never

/**
 * Router store. Use {@link createRouter} to create it.
 *
 * It is a simple router without callbacks. Think about it as a URL parser.
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
export type Router<AppPages extends Pages = Pages> = Store<
  Page<AppPages, keyof AppPages> | undefined
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
export function createRouter<AppPages extends Pages>(
  routes: Routes<AppPages>
): Router<AppPages>

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
export function openPage<
  AppPages extends Pages,
  PageName extends keyof AppPages
>(
  router: Router<AppPages>,
  name: PageName,
  ...params: AppPages[PageName] extends void ? [] : [Params<AppPages[PageName]>]
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
export function getPagePath<
  AppPages extends Pages,
  PageName extends keyof AppPages
>(
  router: Router<AppPages>,
  name: PageName,
  ...params: RouteParams<AppPages, PageName>
): string
