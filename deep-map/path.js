export function getPath(obj, path) {
  let allKeys = getAllKeysFromPath(path)
  let res = obj
  for (let key of allKeys) {
    if (res === undefined) {
      break
    }
    res = res[key]
  }
  return res
}

/**
 * Set a deep value by key.
 * Does little runtime checks. Arrays are initialized with `undefiend` as their missing value
 * (same as `Array(n)`)
 *
 * @param obj Any object
 * @param path Path splitted by dots. Arrays accessed like in JS: props.arr[1].nested
 */
export function setPath(obj, path, value) {
  return setByKey(obj, getAllKeysFromPath(path), value)
}

/**
 * When it mutates anything, it also changes reference to the entity via `structuredClone`.
 * In other cases it returns reference to the same object.
 */
function setByKey(obj, splittedKeys, value) {
  let key = splittedKeys[0]
  ensureKey(obj, key, splittedKeys[1])

  if (splittedKeys.length === 1) {
    if (value === undefined) delete obj[key]
    else obj[key] = value
    return Array.isArray(obj) ? [...obj] : { ...obj }
  }
  obj[key] = setByKey(obj[key], splittedKeys.slice(1), value)
  return obj
}

const arrayIndexFinderRegex = /(.*)\[(\d+)\]/
function getAllKeysFromPath(path) {
  return path.split('.').flatMap(key => {
    if (arrayIndexFinderRegex.test(key)) {
      let res = key.match(arrayIndexFinderRegex)
      return res.slice(1)
    }
    return [key]
  })
}
function ensureKey(obj, key, nextKey) {
  if (key in obj) {
    return
  }
  let nextKeyAsInt = parseInt(
    nextKey !== null && nextKey !== undefined ? nextKey : ''
  )
  if (Number.isNaN(nextKeyAsInt)) {
    obj[key] = {}
  } else {
    obj[key] = Array(nextKeyAsInt + 1).fill(undefined)
  }
}
