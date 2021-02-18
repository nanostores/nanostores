import { createPersistent } from '../index.js'

let settings = createPersistent<{
  favorite?: string
  theme: 'light' | 'dark'
}>({
  theme: 'light'
})

settings.subscribe(value => {
  console.log(value.theme)
})

settings.setKey('theme', 'dark')
settings.setKey('favorite', '1')
settings.setKey('favorite', undefined)
