/**
 * test if two types are exactly the same at compile time
 * @example
 * isEqual<[string][0], string>(true)
 * isEqual<[string][0], number>(true) // compile error
 */
export function isEqual<A, B>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  arg: A extends B ? (B extends A ? true : false) : false
): void {}
