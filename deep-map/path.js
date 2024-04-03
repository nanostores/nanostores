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

export function setPath(obj, path, value) {
  return setByKey(obj != null ? obj : {}, getAllKeysFromPath(path), value)
}

function setByKey(obj, splittedKeys, value) {
  let key = splittedKeys[0]
  ensureKey(obj, key, splittedKeys[1])
  let copy = Array.isArray(obj) ? [...obj] : { ...obj }
  if (splittedKeys.length === 1) {
    if (value === undefined) {
      if (Array.isArray(obj)) {
        copy.splice(key, 1)
      } else {
        delete copy[key]
      }
    } else {
      copy[key] = value
    }
    return copy
  }
  let newVal = setByKey(obj[key], splittedKeys.slice(1), value)
  obj[key] = newVal
  return obj
}

const ARRAY_INDEX = /(.*)\[(\d+)\]/

function getAllKeysFromPath(path) {
  return path.split('.').flatMap(key => getKeyAndIndicesFromKey(key))
}

function getKeyAndIndicesFromKey(key) {
  if (ARRAY_INDEX.test(key)) {
    let [, keyPart, index] = key.match(ARRAY_INDEX)
    return [...getKeyAndIndicesFromKey(keyPart), index]
  }
  return [key]
}

const IS_NUMBER = /^\d+$/
function ensureKey(obj, key, nextKey) {
  if (key in obj) {
    return
  }

  let isNum = IS_NUMBER.test(nextKey)

  if (isNum) {
    obj[key] = Array(parseInt(nextKey, 10) + 1).fill(undefined)
  } else {
    obj[key] = {}
  }
}
