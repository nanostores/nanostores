import { createPersistent } from '../index.js'

let settings = createPersistent<{
  favorite?: string
  theme: 'light' | 'dark'
}>({
  theme: 'light'
})

settings.subscribe(value => {
  // THROWS 'light' does not exist on type
  console.log(value.light)
})

// THROWS "1"' is not assignable to parameter of type '"light" | "dark"
settings.setKey('theme', '1')
// THROWS '"option"' is not assignable to parameter of type
settings.setKey('option', '1')
// THROWS 'undefined' is not assignable to parameter of type '"light" | "dark"'
settings.setKey('theme', undefined)
