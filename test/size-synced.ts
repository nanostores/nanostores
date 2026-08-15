#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { styleText } from 'node:util'

interface SizeLimitCheck {
  limit: string
  name: string
}

let root = new URL('../', import.meta.url)

function parseSize(limit: string): number {
  let match = /^([\d.]+)\s*(B|kB)$/.exec(limit)
  if (!match) {
    throw new Error(`Unknown Size Limit format: ${limit}`)
  }
  let size = parseFloat(match[1]!)
  return match[2] === 'kB' ? size * 1000 : size
}

let errors: string[] = []

function check(
  place: string,
  content: string,
  pattern: RegExp,
  expected: number[]
): void {
  let match = pattern.exec(content)
  if (!match) {
    errors.push(`Can not find sizes in ${place} by ${pattern}`)
    return
  }
  let sizes = match.slice(1).map(Number)
  if (sizes.join() !== expected.join()) {
    errors.push(
      `${place} has ${sizes.join(' and ')} bytes, ` +
        `but Size Limit has ${expected.join(' and ')} bytes`
    )
  }
}

let pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8')) as {
  'description': string
  'size-limit': SizeLimitCheck[]
}
let readme = await readFile(new URL('README.md', root), 'utf8')

let limits = pkg['size-limit'].map(i => parseSize(i.limit))
let min = Math.min(...limits)
let max = Math.max(...limits)

check('package.json description', pkg.description, /\((\d+) bytes\)/, [min])
check('README.md', readme, /Between (\d+) and (\d+) bytes/, [min, max])

if (errors.length > 0) {
  let message = styleText('red', errors.join('\n'), { stream: process.stderr })
  process.stderr.write(`${message}\n`)
  process.exit(1)
}
